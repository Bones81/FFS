const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Nomination = require('../models/nominations')
const nominationSeed = require('../models/seed_nominations')
const Screening = require('../models/screening')
const Movie = require('../models/movies')

const maintenance = require('../models/maintenance') 

const genres = require('../models/genres')

const nominators = require('../models/nominators')

let nominators_sorted = nominators.sort((a,b) => {
  if(a > b) {
    return 1;
  } else {
    return -1;
  }
})

//JSON
router.get('/json', (req, res) => {
  Nomination.find({}).populate("screening").populate("nominee").exec((err, nominations) => {
    if (err) console.log(err);
    res.json(nominations)
  })
})

router.get('/:id/json', (req, res) => {
  Nomination.findById(req.params.id, (err, foundNom) => {
    res.json(foundNom)
  }).populate("screening").populate("nominee")
})

// router.get('/json/populatefixattempt', (req, res) => {
//   Nomination.findOne({}, (err, nom) => {
//       console.log(nom);
//       // nom.nominee = new mongoose.Types.ObjectId(nom.nominee)
//       // console.log('after' + nom.nominee);
//       // nom.screening = new mongoose.Types.ObjectId(nom.screening)
//       // Nomination.findByIdAndUpdate(nom._id, nom, {new: true}, (err, updatedNom) => {
//       //   console.log(updatedNom); 
//       // })
//   }).populate("screening").populate("nominee")
// })


//INDEX
router.get('/', (req, res) => {
  if (maintenance) {
    res.render('maintenance.ejs', {tabTitle: 'FFS Maintenance Mode'})
} else {
    Screening.find({}, (err, screenings) => {
      if(err) console.log('screenings error' + err);
      Movie.find({}, (err, movies) => {
        if(err) console.log('movies error' + err);
        Nomination.find({}).populate([
          {
            path: "screening",
            ref: "Screening"
          }, 
          {
            path: "nominee",
            ref: "Movie"
          }]).exec((err, nominations) => {
          if(err) console.log(err);
          nominations.sort((a,b) => {
            if (a.screening.date < b.screening.date) {
              return 1
            } else {
              return -1
            }
          })
          res.render('nominations/index.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'FFS Nominations',
            nominations: nominations,
            screenings: screenings,
            movies: movies
          })
        })
      })
    })
  }
})

//NEW
router.get('/new', (req, res) => {
  if (maintenance) {
    res.render('maintenance.ejs', {tabTitle: 'FFS Maintenance Mode'})
} else {
    Screening.find({}, (err, screenings) => { //show screenings in reverse date order
      screenings.sort((a,b) => {
        if (a.date > b.date) { return 1 } else { return -1 };
      })
      Movie.find({}, (err, movies) => {
        res.render('nominations/create_nomination.ejs', {
          user: req.user,
          sessionID: req.sessionID,
          tabTitle: 'Create Nomination',
          screenings: screenings,
          movies: movies,
          genres: genres,
          nominators: nominators_sorted
        })
      })
    })
  }
})

//FIND ORIGINAL NOMINATOR
//findOrigNominator needs to return the nominator string of the earliest nomination for the movie parameter and a given nomination
const findOrigNominator = (movie, nomination) => {

}


//UPDATE MOVIE AND SCREENING WHEN NOM IS WINNER && PULLED FROM MOVIES DB
const updateWinningMovieAndScreening = (nomObj, movie, screening, nomination, res) => {
  Movie.findByIdAndUpdate(movie._id, {$set: {screened: nomObj.winner, screening: screening._id, nominations: [...movie.nominations, nomination._id], allNominators: [...movie.allNominators, nomObj.nominator], origNominator: movie.origNominator}}, {new: true}, (err, updatedMovie) => {
    //finally, update the screening with the new data about the selection and nominations
    Screening.findByIdAndUpdate(screening._id, {$set: {selection: movie._id, nominations: [...screening.nominations, nomination._id]}}, {new: true}, (err, updatedScreening) => {
      // and redirect to the nominations archive
      console.log("Nominated movie (winner): " + updatedMovie);
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
      console.log("Nominated movie (non-winner): " + updatedMovie);
      res.redirect('/nominations') 
    })
  })
}

//COULDN'T FIGURE OUT HOW TO MAKE ABOVE CODE DRYER WITHOUT BREAKING THE APP WHEN ACCESSING NON-WINNING MOVIES. NEEDED TO BE ABLE TO ACCESS VALID SCREENING._ID or NO SCREENING._ID. SETTING IT TO NULL WOULD BREAK THINGS

//NOMINATION CREATION WITH A MOVIE FROM THE MOVIES DB
const createNominationFromDB = (nomObj, movie, screening, res) => { //create a nomination for a given screening/movie association with a movie already in the movies db
  Nomination.create(nomObj, (err, createdNomination) => {
    if(err) console.log(err);
    if (!movie.nominations.length) { // if there are no previous nominations for this movie, assign the original nominator
      movie.origNominator = createdNomination.nominator

      // update movie with any new data for winner, screening, nominations, and nominators
      if(nomObj.winner) { // if the new nom is for a winning movie, update appropriately
        updateWinningMovieAndScreening(nomObj, movie, screening, createdNomination, res);
      } else { // if it's not a winner, update appropriately.
        updateNonWinningMovieAndScreening(nomObj, movie, screening, createdNomination, res);
      }

    } else { // manage the origNominator value, if necessary. If nomination is earlier than a previous nomination, update the origNominator value appropriately
      Nomination.find({nominee: movie._id}, (err, foundNoms) => { //find all noms associated with the same movie as the new nomination 
        if (err) console.log(err.message)
        let origNom = null
        let origNominator = ""
        if (!foundNoms.length) { // if there are no found noms, this means the movie has never been nominated.
          movie.origNominator = origNominator
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
        if (origNom.screening > createdNomination.screening) {
          origNom = createdNomination
        }
    
        origNominator = origNom.nominator // set the origNominator with the earliest nom's nominator value
        console.log("findOrigNominator returned: " + origNominator)
        movie.origNominator = origNominator // return the string

        // update movie with any new data for winner, screening, nominations, and nominators
        if(nomObj.winner) { // if the new nom is for a winning movie, update appropriately
          updateWinningMovieAndScreening(nomObj, movie, screening, createdNomination, res);
        } else { // if it's not a winner, update appropriately.
          updateNonWinningMovieAndScreening(nomObj, movie, screening, createdNomination, res);
        }
      })
    }
  })
}

//CREATE
router.post('/', (req, res) => {
  // console.log(req.body)
  let nomObj = {} // build a properly formatted nomination prior to calling Nomination.create
  // all Nominations conform to model with keys that include screening, nominee, nominator, blurb, and winner.
  nomObj.nominator = req.body.nominator
  nomObj.blurb = req.body.blurb
  nomObj.winner = req.body.winner === "on" ? true : false

  if (req.body.nominee) { // if user chooses an unwatched movie from the database to submit
    console.log('User chose an unwatched movie from existing db of movies. Creating nomination...');
    Screening.findOne({weekID: req.body.screeningID}, (err, foundScreening) => { //assign the screeningID to the new nomination object
      nomObj.screening = foundScreening._id
      Movie.findOne({title: req.body.nominee}, (err, foundMovie) => { // find the movie in the database and assign it to the nomination object
        nomObj.nominee = foundMovie._id
        // Create the new nomination
        createNominationFromDB(nomObj, foundMovie, foundScreening, res);
      }) 
    })
  } else { //if it's a first-time nominee
    console.log('taking the else road')
    //check that it's not a duplicate
    Movie.find({}, (err, allMovies) => {
      for (let movie of allMovies) {
          if (movie.title === req.body.title) {
              res.send("<h1>Cannot create movie. Movie's title already exists in database. Check existing movie list.<h1>")
              return
          }
      }
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
      movies.sort((a,b) => {
        if(a.title > b.title) {
          return 1
        } else {
          return -1
        }
      })
      res.render('nominations/new.ejs', {
        user: req.user,
        sessionID: req.sessionID,
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
  if (maintenance) {
    res.render('maintenance.ejs', {tabTitle: 'FFS Maintenance Mode'})
  } else {
    Nomination.findById(req.params.id, (err, foundNomination) => {
      res.render('nominations/show.ejs', {
        user: req.user,
        sessionID: req.sessionID,
        nomination: foundNomination,
        tabTitle: foundNomination.nominee.title + ' | Nomination' 
      })
    }).populate("screening").populate("nominee")
  }
})


//EDIT
router.get('/:id/edit', (req, res) => {
  if (maintenance) {
    res.render('maintenance.ejs', {tabTitle: 'FFS Maintenance Mode'})
  } else {
    Screening.find({}, (err, allScreenings) => { 
      Nomination.findById(req.params.id, (err, foundNom) => {
        res.render('nominations/edit.ejs', {
          user: req.user,
          sessionID: req.sessionID,
          tabTitle: foundNom.nominee.title + " | Edit Nomination",
          nomination: foundNom,
          screenings: allScreenings,
          nominators: nominators_sorted
        })
      }).populate("screening").populate("nominee")
    })
  }
})

//CONFIRM DELETE
router.get('/:id/confirm-delete', (req, res) => {
    Nomination.findById(req.params.id, (err, foundNom) => {
      res.render('nominations/confirm_delete.ejs', {
        user: req.user,
        sessionID: req.sessionID,
        tabTitle: 'Confirm delete?',
        nomination: foundNom
      })
    }).populate("screening").populate("nominee")
})
  
//DELETE
router.delete('/:id', (req, res) => {
    Nomination.findByIdAndRemove(req.params.id, (err, deletedNomination) => {
      //Find and remove that nomination from its related screening
      Screening.findOneAndUpdate({weekID: deletedNomination.screening}, {$pull: {nominations: deletedNomination}}, {new: true}, (err, updatedScreening) => {
        console.log('Removed nom from associated screening: ' + updatedScreening);
      })
      Movie.findById(deletedNomination.nominee, (err, relatedMovie) => { //find the related movie, which becomes the template for a movie update object
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
              if(deletedNomination.screening > nom.screening) { // if any remaining nomination is earlier than the deleted Nom, isEarliestNom becomes false
                isEarliestNom = false
                break
              }
              if (nom.screening <= earliestRemainingNomDate) { //progressively assign the earliest nominator
                earliestRemainingNomDate = nom.screening
                earliestNominator = nom.nominator
              }
            }
            if (isEarliestNom) { // if it was the earliest nomination, ensure that relatedMovie.origNominator is the nominator of the earliestRemainingNomDate before updating movie
                relatedMovie.origNominator = earliestNominator
                updateMovie(relatedMovie, deletedNomination)
            } else { // if it wasn't the earliest nomination, no change to the origNominator should be necessary.
                updateMovie(relatedMovie, deletedNomination)
            }
          } else { // If no other nominations exist, reset relatedMovie.origNominator to be an empty string. 
            relatedMovie.origNominator = ""
            updateMovie(relatedMovie, deletedNomination)
          }
        })

        const updateMovie = (relatedMovie, deletedNomination) => {
          if (relatedMovie.screened) { // edge case hypothetical handling: if deleted nomination was a winning nom/movie, change movie's data to make it an unscreened movie
            relatedMovie.screened = false
            relatedMovie.screening = null
            Screening.findOneAndUpdate({selection: relatedMovie._id}, {$set: {selection: null}}, {new: true}, (err, updatedScreening) => { //would have to update screening as well
              console.log('reset selection for screening ' + updatedScreening.weekID); 
            })
          }
          //then find any one instance of the nominator to remove from the movie's nominators list
          let nominatorIndex = relatedMovie.allNominators.indexOf(deletedNomination.nominator)
          relatedMovie.allNominators.splice(nominatorIndex, 1)
          //remove nomination from movie's nominations list
          let nominationIndex = relatedMovie.nominations.indexOf(deletedNomination._id)
          relatedMovie.nominations.splice(nominationIndex, 1)
          //then, update the movie's nominations, origNominator (if necessary), and allNominators fields
          Movie.findByIdAndUpdate(deletedNomination.nominee, relatedMovie, {new: true}, (err, updatedMovie) => {
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

    Nomination.findById(req.params.id).populate("screening").populate("nominee").exec((err, preUpdateNom) => {
      if(err) console.log(err.message);
      console.log(preUpdateNom);
      if(req.body.screening !== preUpdateNom.screening) { //if the nomination is now to be associated with a different screening, we need to determine what is now the earliest nomination for this movie. It may be changing as a result of this update. If it is, we need to reassign the origNominator for the movie. Yuck.
        Nomination.find({nominee: preUpdateNom.nominee._id}).populate("nominee").exec((err, movieNominations) => { // find all Nominations for the preUpdateNom's movie
          if(err) console.log(err.message);
          // then compare the screening date of each nom, figuring out which is the earliest
          
          movieNominations.sort((a,b) => { //sort the existing nominations
            if (a.screening > b.screening) {
              return 1
            } else {
              return -1
            }
          })
          let earliestNom = movieNominations[0]

          if (earliestNom.screening.weekID === preUpdateNom.screening.weekID) { 
            earliestNom = movieNominations[1] // if the nomination we are updating the screening date for is the earliest current nomination, we now need to find the next earliest nomination, i.e. movieNominations[1]. Otherwise, we will be including the old screening date in the comparison that follows.
          }
          let isEarliestNom = true //assume our updating nom is the earliest
          console.log('line 419: ' + earliestNom.screening.weekID, req.body.screening);
          if (earliestNom.screening.weekID < req.body.screening) { // Check whether the updating nom is in fact earliest.
              isEarliestNom = false
          }

          if (isEarliestNom) { //if the updating nom is the earliest nom, update the origNominator field in the movie with the nominator provided in the edit form
            Movie.findByIdAndUpdate(preUpdateNom.nominee._id, {$set: {origNominator: req.body.nominator}}, {new: true}, (err, updatedMovie) => {
              console.log('New earliest nomination for movie, origNominator updated: ' + updatedMovie);
            })
          } else if (preUpdateNom.nominee.origNominator !== earliestNom.nominator) { //if our updating nom is not the earliest nom, reset the movie's origNominator with the earliestNom's nominator, if it is different from the existing origNominator
            Movie.findByIdAndUpdate(preUpdateNom.nominee._id, {$set: {origNominator: earliestNom.nominator}}, {new: true}, (err, updatedMovie) => {
              console.log('Earliest nomination for nominated movie changing as a result of this update. Updated movie: ' + updatedMovie)
            })
          }
          // 
        })
      }

      
        
        //what to do if updated nom is for different nominator. must splice nominator name into allNominators of the movie, removing oldNominator in the process.
        if(preUpdateNom.nominator !== req.body.nominator) {
          Movie.findById(preUpdateNom.nominee._id, (err, foundMovie) => {
            let indexOfOldNominator = foundMovie.allNominators.indexOf(preUpdateNom.nominator)
            foundMovie.allNominators.splice(indexOfOldNominator, 1, req.body.nominator)
            Movie.findByIdAndUpdate(preUpdateNom.nominee._id, {$set: {allNominators: foundMovie.allNominators}}, {new: true}, (err, updatedMovie) => {
              console.log('Updated nominators list for nominated movie: ' + updatedMovie);
            }) 
          })
        }

        if(preUpdateNom.winner !== req.body.winner) { //if winner status has changed, update appropriately based on which way it changed
          Screening.findOne({weekID: req.body.screening}, (err, nominatedScreening) => {
            req.body.screening = nominatedScreening._id 
            Nomination.findByIdAndUpdate(req.params.id, req.body).populate("nominee").exec((err, updatedNomination) => { //
              if (err) console.log(err.message);
              console.log("updatedNomination: " + updatedNomination);
              //if changing nomination.winner status, update movie and screening
              if(checked !== updatedNomination.nominee.screened && checked === true) { // if changing from non-winner to winner
                Movie.findByIdAndUpdate(updatedNomination.nominee._id, {$set: {screened: checked, screening: updatedNomination.screening._id}}, {new: true}, (err, updatedMovie) => {
                  err ? console.log(err) : console.log('Associated screening with nominated movie: ' + updatedMovie);
                  Screening.findByIdAndUpdate(updatedNomination.screening._id, {$set: {selection: updatedNomination.nominee._id}}, {new: true}, (err, updatedScreening) => {
                    // update associated screening with the nominated movie (selection)
                    err ? console.log(err) : console.log('Updated selection for screening: ' + updatedScreening); 
                  }) 
                })
              } else if (checked !== updatedNomination.nominee.screened && checked === false) { // if changing from winner to non-winner or if remaining a non-winner
                Movie.findByIdAndUpdate(updatedNomination.nominee._id, {$set: {screened: checked, screening: null}}, {new: true}, (err, updatedMovie) => {
                  err ? console.log(err) : console.log('Unassociated screening with nominated movie: ' + updatedMovie);
                  Screening.findByIdAndUpdate(updatedNomination.screening._id, {$set: {selection: null}}, {new: true}, (err, updatedScreening) => {
                    err ? console.log(err) : console.log('Reset selection data for screening: ' + updatedScreening);
                  }) 
                })
              }
              res.redirect('/nominations')
            })
          })
        } else { //the different screenings and nominated movie don't need their winner status changed, so the nomination update can go on as planned
          Screening.findOne({weekID: req.body.screening}, (err, nominatedScreening) => { //associate any new screening with nomination before update
            req.body.screening = nominatedScreening._id
            Nomination.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, updatedNomination) => {
              err ? console.log(err.message) : console.log('Updated nomination: ' + updatedNomination);
              res.redirect('/nominations')
            })
          })
        }
    })
  })

// DELETE APP-BREAKING NOMS BY ID, USE WITH CAUTION
// Nomination.findByIdAndRemove('63df3d39c96c3160fcf15c1b', (err, dNom) => {
//   console.log(dNom); 
// })

// Nomination.findOne({nominator: 'Sujan Trivedi'}, (err, foundNom) => {
//   console.log(foundNom)
//   Screening.findOne({_id: foundNom.screening}, (err, foundScreening) => {
//     console.log(foundScreening); 
//   })
// })

// Screening.findOne({weekID: 69}, (err, foundScreening) => {
//   console.log(foundScreening); 
// })

module.exports = router