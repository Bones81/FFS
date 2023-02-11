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
  Screening.find({}, (err, screenings) => {
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

//CREATE
router.post('/', (req, res) => {
  console.log(req.body)
  let nomObj = {} // build a properly formatted nomination prior to calling Nomination.create
  // all Nominations conform to model with keys that include screening, nominee, nominator, blurb, and winner.
  nomObj.nominator = req.body.nominator
  nomObj.blurb = req.body.blurb
  nomObj.winner = req.body.winner === "on" ? true : false

  if (req.body.nominee) { // if user chooses a previous nominee to resubmit
    Screening.findOne({weekID: req.body.screeningID}, (err, foundScreening) => { //assign the screeningID to the new nomination object
      nomObj.screening = foundScreening._id
      Movie.findOne({title: req.body.nominee}, (err, foundMovie) => { // find the movie in the database and assign it to the nomination object
        nomObj.nominee = foundMovie._id
        // Create the new nomination
        Nomination.create(nomObj, (err, createdNomination) => {
          if(err) console.log(err);
          console.log('nomObj.winner: ' + nomObj.winner);
          // update movie with any new data for winner, screening, nominations, and nominators
          if(nomObj.winner) { // if it's a winning movie, update appropriately
            Movie.findByIdAndUpdate(foundMovie._id, {$set: {screened: nomObj.winner, screening: foundScreening._id, nominations: [...foundMovie.nominations, createdNomination._id], allNominators: [...foundMovie.allNominators, nomObj.nominator]}}, (err, updatedMovie) => {
              //finally, update the screening with the new data about the selection and nominations
              Screening.findByIdAndUpdate(foundScreening._id, {$set: {selection: foundMovie._id, nominations: [...foundScreening.nominations, createdNomination._id]}}, {new: true}, (err, updatedScreening) => {
                // and redirect to the nominations archive
                res.redirect('/nominations');
              })
            })
          } else { // if it's not a winner, update appropriately
            Movie.findByIdAndUpdate(foundMovie._id, {$set: {screened: nomObj.winner, nominations: [...foundMovie.nominations, createdNomination._id], allNominators: [...foundMovie.allNominators, nomObj.nominator]}}, (err, updatedMovie) => {
              Screening.findByIdAndUpdate(foundScreening._id, {$set: {nominations: [...foundScreening.nominations, createdNomination._id]}}, {new: true}, (err, updatedScreening) => {
                // and redirect to the nominations archive
                res.redirect('/nominations') 
              })
            })
          }
        })
      }) 
    })
  } else {
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
            Movie.findByIdAndUpdate(createdMovie._id, {$set: {nominations: [createdNomination._id]}}, {new: true}, (err, updatedMovie) => {
              Screening.findByIdAndUpdate(foundScreening._id, {$set: {nominations: [...foundScreening.nominations, createdNomination._id]}}, {new: true}, (err, updatedScreening) => {
                console.log(updatedScreening)
                if(movieObj.screened === true) { //only if movie was a winning nom, set the screening selection to reflect that
                  Screening.findByIdAndUpdate(foundScreening._id, {$set: {selection: updatedMovie._id}}, {new: true}, (err, updatedScreening2) => {
                    console.log('Set selection for screening: ' + updatedScreening2);
                  })
                }
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
        tabTitle: foundNom.title + " | Edit Nomination",
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
      res.redirect('/nominations')
    })
})

//UPDATE
router.put('/:id', (req, res) => {
    
    console.log(req.body)
    let checked = req.body.winner === "on" ? true : false
    req.body.winner = checked
    Nomination.findByIdAndUpdate(req.params.id, req.body, (err, foundNomination) => {
      res.redirect('/nominations')
    })
})

// DELETE APP-BREAKING NOMS BY ID, USE WITH CAUTION
// Nomination.findByIdAndRemove('63df3d39c96c3160fcf15c1b', (err, dNom) => {
//   console.log(dNom); 
// })

module.exports = router