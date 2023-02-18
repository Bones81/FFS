const express = require('express')
const router = express.Router()

const Nomination = require('../models/nominations')
const nominationSeed = require('../models/seed_nominations')
const Screening = require('../models/screening')
const Movie = require('../models/movies')

const genres = [
  'Action',
  'Adventure',
  'Animated',
  'Art Film',
  'Comedy',
  'Comic Book-Based',
  'Crime',
  'Drama',
  'Experimental',
  'Fantasy',
  'Historical',
  'Holiday',
  'Musical',
  'Mystery',
  'Horror',
  'Romance',
  'Satire',
  'Science Fiction',
  'Thriller',
  'Video Game-Based',
  'Western',
  'Other'
]

const nominators = [
  'Nathan Freeman',
  'Sujan Trivedi',
  'Stephanie Weitzner',
  'Nigam Trivedi',
  'Walter J. McMath',
  'John Vennema',
  'Katharine Croke',
  'Paul Ziemba',
  'Emily Ziemba',
  'Carmen Roman',
  'Ben Beckley-Chayes',
  'Jeffrey Kitrosser',
  'Salman Baig',
  'Jeremy Weissmann',
  'Micah Baskir',
  'Brain Trust',
  'Ziemba Household',
]

let nominators_sorted = nominators.sort((a,b) => {
  if(a > b) {
    return 1;
  } else {
    return -1;
  }
})

//JSON
router.get('/json', (req, res) => {
  Nomination.find({}, (err, nominations) => {
    res.json(nominations)
  })
})

router.get('/:id/json', (req, res) => {
  Nomination.findById(req.params.id, (err, foundNom) => {
    res.json(foundNom)
  })
})


//INDEX
router.get('/', (req, res) => {
  Screening.find({}, (err, screenings) => {
    Movie.find({}, (err, movies) => {
      Nomination.find({}, (err, nominations) => {
        nominations.sort((a,b) => {
          if (a.screening.date < b.screening.date) {
            return 1
          } else {
            return -1
          }
        })
        res.render('nominations/index.ejs', {
          tabTitle: 'FFS Nominations',
          nominations: nominations,
          screenings: screenings,
          movies: movies
        })
      }).populate("screening").populate("nominee")
    })
  })
})

//NEW
router.get('/new', (req, res) => {
  Screening.find({}, (err, screenings) => { //show screenings in reverse date order
    screenings.sort((a,b) => {
      if (a.date > b.date) { return 1 } else { return -1 };
    })
    Movie.find({}, (err, movies) => {
      res.render('nominations/create_nomination.ejs', {
        tabTitle: 'Create Nomination',
        screenings: screenings,
        movies: movies,
        genres: genres,
        nominators: nominators_sorted
      })
    })
  })
})

//FIND ORIGINAL NOMINATOR
//findOrigNominator needs to return the nominator string of the earliest nomination for the movie parameter and a given nomination
const findOrigNominator = (movie, nomination) => {
  Nomination.find({nominee: movie._id}, (err, foundNoms) => {
    if (err) console.log(err.message)
    let origNom = null
    let origNominator = ""
    if (!foundNoms.length) { // if there are no found noms, this means the movie has never been nominated.
      return origNominator
    }
    // loop through existing noms and set the earliest one as origNom
    for (let nom of foundNoms) {
      if(!origNom) {
        origNom = nom
      }
      if (origNom.screening > nom.screening) { // if nom.screening (weekID) is earlier than current origNom, replace it
        origNom = nom
      }
    }
    //check if newest nom is earlier
    if (origNom.screening > nomination.screening) {
      origNom = nomination
    }

    origNominator = origNom.nominator // set the origNominator with the earliest nom's nominator value
    console.log("findOrigNominator returned: " + origNominator)
    return origNominator // return the string
  })
}


//UPDATE MOVIE AND SCREENING WHEN NOM IS WINNER && PULLED FROM MOVIES DB
const updateWinningMovieAndScreening = (nomObj, movie, screening, nomination, res) => {
  Movie.findByIdAndUpdate(movie._id, {$set: {screened: nomObj.winner, screening: screening._id, nominations: [...movie.nominations, nomination._id], allNominators: [...movie.allNominators, nomObj.nominator], origNominator: movie.origNominator}}, {new: true}, (err, updatedMovie) => {
    //finally, update the screening with the new data about the selection and nominations
    Screening.findByIdAndUpdate(screening._id, {$set: {selection: movie._id, nominations: [...screening.nominations, nomination._id]}}, {new: true}, (err, updatedScreening) => {
      // and redirect to the nominations archive
      console.log("Nominated movie-winner: " + updatedMovie);
      res.redirect('/nominations');
    })
  })
}

//UPDATE NON-WINNING MOVIE AND SCREENING
const updateNonWinningMovieAndScreening = (nomObj, movie, screening, nomination, res) => {
  console.log('Found Movie OrigNominator: ' + movie.origNominator);
  Movie.findByIdAndUpdate(movie._id, {$set: {screened: nomObj.winner, nominations: [...movie.nominations, nomination._id], allNominators: [...movie.allNominators, nomObj.nominator], origNominator: movie.origNominator}}, {new: true}, (err, updatedMovie) => {
    Screening.findByIdAndUpdate(screening._id, {$set: {nominations: [...screening.nominations, nomination._id]}}, {new: true}, (err, updatedScreening) => {
      // and redirect to the nominations archive
      console.log("Nominated movie-non-winner: " + updatedMovie);
      res.redirect('/nominations') 
    })
  })
}

//ASYNC NOMINATION CREATION
const createNomination = (nomObj, movie, screening, res) => {
  Nomination.create(nomObj, (err, createdNomination) => {
    if(err) console.log(err);
    if (!movie.nominations.length) { // if there are no previous nominations for this movie, assign the original nominator
      movie.origNominator = createdNomination.nominator
    } else { // manage the origNominator value, if necessary. If nomination is earlier than a previous nomination, update the origNominator value appropriately
      movie.origNominator = findOrigNominator(movie, createdNomination)
    }

    ////FIGURE OUT HOW TO MAKE THE NEXT LINES WAIT FOR FINDORIGNOMINATOR TO COMPLETE!!!

    // update movie with any new data for winner, screening, nominations, and nominators
    if(nomObj.winner) { // if it's a winning movie, update appropriately
      updateWinningMovieAndScreening(nomObj, movie, screening, createdNomination, res);
    } else { // if it's not a winner, update appropriately.
      updateNonWinningMovieAndScreening(nomObj, movie, screening, createdNomination, res);
    }
  })
}

//CREATE
router.post('/', (req, res) => {
  console.log(req.body)
  let nomObj = {} // build a properly formatted nomination prior to calling Nomination.create
  // all Nominations conform to model with keys that include screening, nominee, nominator, blurb, and winner.
  nomObj.nominator = req.body.nominator
  nomObj.blurb = req.body.blurb
  nomObj.winner = req.body.winner === "on" ? true : false

  if (req.body.nominee) { // if user chooses an unwatched movie from the database to submit
    Screening.findOne({weekID: req.body.screeningID}, (err, foundScreening) => { //assign the screeningID to the new nomination object
      nomObj.screening = foundScreening._id
      Movie.findOne({title: req.body.nominee}, (err, foundMovie) => { // find the movie in the database and assign it to the nomination object
        nomObj.nominee = foundMovie._id
        // Create the new nomination
        createNomination(nomObj, foundMovie, foundScreening, res);
      }) 
    })
  } else { //if it's a first-time nominee
    console.log('taking the else road')
    let movieObj = req.body
    let castArray = req.body.cast.split(', ')
    movieObj.cast = castArray
    movieObj.year = +req.body.year // convert to number with unary operator (+)
    movieObj.origNominator = req.body.nominator
    movieObj.allNominators = [req.body.nominator]
    movieObj.nominations = []

    Screening.findOne({weekID: req.body.screeningID}, (err, foundScreening) => {
      if (req.body.winner === "on") { // if the nomination includes a newly added movie that also was a winner, make sure the movie data reflects that when created
        movieObj.screened = true
        movieObj.screening = foundScreening._id
      }
      nomObj.screening = foundScreening._id // regardless, the nomination will be associated with the screening date indicated in the form
      Movie.create(movieObj, (err, createdMovie) => { // finally, you can create the movie
          if(err) console.log(err);
          //assign the newly created movie to the nomination object
          nomObj.nominee = createdMovie._id
          Nomination.create(nomObj, (err, createdNomination) => { // and then you can create the nomination
            if(err) console.log(err);
            // now update the movie and the screening to include the newly created info for both the nomination and the movie
            Movie.findByIdAndUpdate(createdMovie._id, {$set: {nominations: [createdNomination._id]}}, {new: true}, (err, updatedMovie) => { //associate nomination with movie
              Screening.findByIdAndUpdate(foundScreening._id, {$set: {nominations: [...foundScreening.nominations, createdNomination._id]}}, {new: true}, (err, updatedScreening) => { //associate nomination with screening
                err ? console.log(err) : console.log(updatedScreening)
                if(movieObj.screened === true) { //only if movie was a winning nom, set the screening selection to reflect that
                  Screening.findByIdAndUpdate(foundScreening._id, {$set: {selection: updatedMovie._id}}, {new: true}, (err, updatedScreening2) => {
                    err ? console.log(err) : console.log(updatedScreening2);
                    console.log('Set selection for screening: ' + updatedScreening2);
                  })
                }
                console.log("Movie created: " + updatedMovie);
                console.log("Nomination created: " + createdNomination);
                res.redirect('/nominations');
              })
            })
          })
      })
    })
  }

})

router.post('/initial-info', (req, res) => {
  let nominator = req.body.nominator
  let screeningID = req.body.screening
  let nomination_type = req.body.nomination_type
  // console.log(nomination_type)
  Screening.find({weekID: screeningID}, (err, screening) => {
    screening = screening[0]
    Movie.find({}, (err, movies) => {
      res.render('nominations/new.ejs', {
        tabTitle: 'Continue Nomination',
        screening: screening,
        movies: movies,
        genres: genres,
        nominator: nominator,
        nomination_type: nomination_type
      })
    })
  })
})

//SHOW
router.get('/:id', (req, res) => {
    Nomination.findById(req.params.id, (err, foundNomination) => {
      res.render('nominations/show.ejs', {
        nomination: foundNomination,
        tabTitle: foundNomination.title + ' | Nomination' 
      })
    }).populate("screening").populate("nominee")
})


//EDIT
router.get('/:id/edit', (req, res) => {
  Screening.find({}, (err, allScreenings) => { 
    Nomination.findById(req.params.id, (err, foundNom) => {
      res.render('nominations/edit.ejs', {
        tabTitle: foundNom.nominee.title + " | Edit Nomination",
        nomination: foundNom,
        screenings: allScreenings,
        nominators: nominators_sorted
      })
    }).populate("screening").populate("nominee")
  })
})

//CONFIRM DELETE
router.get('/:id/confirm-delete', (req, res) => {
    Nomination.findById(req.params.id, (err, foundNom) => {
      res.render('nominations/confirm_delete.ejs', {
        tabTitle: 'Confirm delete?',
        nomination: foundNom
      })
    }).populate("screening").populate("nominee")
})
  
//DELETE
router.delete('/:id', (req, res) => {
    Nomination.findByIdAndRemove(req.params.id, (err, foundNomination) => {
      Movie.findById(foundNomination.nominee, (err, relatedMovie) => { //find the related movie, which becomes the template for a movie update object
        console.log('movie data prior to update: ' + relatedMovie);

        // SETTING ORIGNOMINATOR FIELD: Find all remaining noms for this movie. If they exist, check whether the nom being deleted is the earliest (Set up an earliestNom variable and loop through the noms, checking the screening date for each, and assigning earliestNom appropriately). 
        Nomination.find({nominee: relatedMovie._id}, (err, remainingNoms) => {
          if (err) console.log(err.message);
          if (remainingNoms.length) {
            console.log("# of remaining noms to consider: " + remainingNoms.length);
            let isEarliestNom = true// boolean representing whether the deleted Nom was the first one for this movie
            let earliestRemainingNomDate = remainingNoms[0].screening
            let earliestNominator = remainingNoms[0].earliestNominator
            for (let nom of remainingNoms) { // check the screening number to see which nomination was earlier, against both the deleted Nom and the other remaining Noms
              if(foundNomination.screening > nom.screening) { // if any remaining nomination is earlier than the deleted Nom, isEarliestNom becomes false
                isEarliestNom = false
                break
              }
              if (nom.screening < earliestRemainingNomDate) { //progressively assign the earliest nominator
                earliestRemainingNomDate = nom.screening
                earliestNominator = nom.nominator
              }
            }
            if (isEarliestNom) { // if it was the earliest nomination, ensure that relatedMovie.origNominator is the nominator of the earliestRemainingNomDate before updating movie
                relatedMovie.origNominator = earliestNominator
                updateMovie(relatedMovie, foundNomination)
            } else { // if it wasn't the earliest nomination, no change to the origNominator should be necessary.
                updateMovie(relatedMovie, foundNomination)
            }
          } else { // If no other nominations exist, reset relatedMovie.origNominator to be an empty string. 
            relatedMovie.origNominator = ""
            updateMovie(relatedMovie, foundNomination)
          }
        })

        const updateMovie = (relatedMovie, foundNomination) => {
          if (relatedMovie.screened) { // edge case hypothetical handling: if deleted nomination was a winning nom/movie, change movie's data to make it an unscreened movie
            relatedMovie.screened = false
            relatedMovie.screening = null
            Screening.findOneAndUpdate({selection: relatedMovie._id}, {$set: {selection: null}}, {new: true}, (err, updatedScreening) => { //would have to update screening as well
              console.log('reset selection for screening ' + updatedScreening.weekID); 
            })
          }
          //then find any one instance of the nominator to remove from the movie's nominators list
          let nominatorIndex = relatedMovie.allNominators.indexOf(foundNomination.nominator)
          relatedMovie.allNominators.splice(nominatorIndex, 1)
          //remove nomination from movie's nominations list
          let nominationIndex = relatedMovie.nominations.indexOf(foundNomination._id)
          relatedMovie.nominations.splice(nominationIndex, 1)
          //then, update the movie's nominations, origNominator (if necessary), and allNominators fields
          Movie.findByIdAndUpdate(foundNomination.nominee, relatedMovie, {new: true}, (err, updatedMovie) => {
            console.log('nomination removed from ' + updatedMovie);
            res.redirect('/nominations')
          })
        }
      })
    })
})

//UPDATE
router.put('/:id', (req, res) => {
    
    console.log(req.body)
    let checked = req.body.winner === "on" ? true : false
    req.body.winner = checked
    Nomination.findByIdAndUpdate(req.params.id, req.body, (err, foundNomination) => {
      //if changing nomination.winner status, update movie and screening
      if(checked !== foundNomination.nominee.screened && checked === true) { // if changing from non-winner to winner
        Movie.findByIdAndUpdate(foundNomination.nominee._id, {$set: {screened: checked, screening: foundNomination.screening._id}}, {new: true}, (err, updatedMovie) => {
          err ? console.log(err) : console.log('Associated screening with nominated movie: ' + updatedMovie);
          Screening.findByIdAndUpdate(foundNomination.screening._id, {$set: {selection: foundNomination.nominee._id}}, {new: true}, (err, updatedScreening) => {
            // update associated screening with the nominated movie (selection)
            err ? console.log(err) : console.log('Updated selection for screening: ' + updatedScreening); 
          }) 
        })
      } else if (checked !== foundNomination.nominee.screened && checked === false) { // if changing from winner to non-winner
        Movie.findByIdAndUpdate(foundNomination.nominee._id, {$set: {screened: checked, screening: null}}, {new: true}, (err, updatedMovie) => {
          err ? console.log(err) : console.log('Unassociated screening with nominated movie: ' + updatedMovie);
          Screening.findByIdAndUpdate(foundNomination.screening._id, {$set: {selection: null}}, {new: true}, (err, updatedScreening) => {
            err ? console.log(err) : console.log('Reset selection data for screening: ' + updatedScreening);
          }) 
        })
      }
      res.redirect('/nominations')
    })
})

// DELETE APP-BREAKING NOMS BY ID, USE WITH CAUTION
// Nomination.findByIdAndRemove('63df3d39c96c3160fcf15c1b', (err, dNom) => {
//   console.log(dNom); 
// })

module.exports = router