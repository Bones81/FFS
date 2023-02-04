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

console.log(nominators_sorted);

//JSON
router.get('/json', (req, res) => {
  Nomination.find({}, (err, nominations) => {
    res.json(nominations)
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
  nomObj.nominator = req.body.nominator
  nomObj.blurb = req.body.blurb
  nomObj.winner = req.body.winner ? true : false
  // nomObj.screening = // figure out how to assign proper screening Object ID to this value
  Screening.findOne({weekID: req.body.screeningID}, (err, foundScreening) => {
    nomObj.screening = foundScreening._id 
  })
  // nomObj.nominee = // figure out how to assign proper movie Object ID to this value

  // res.json(req.body)
  if (req.body.nominee) {
    Screening.findOne({weekID: req.body.screeningID}, (err, foundScreening) => {
      nomObj.screening = foundScreening._id 
      Movie.findOne({title: req.body.nominee}, (err, foundMovie) => {
        console.log(foundMovie)
        nomObj.nominee = foundMovie._id
        Nomination.create(nomObj, (err, createdNomination) => {
          if(err) console.log(err);
          res.redirect('/nominations');
        })
      })
    })
  } else {
    let movieObj = req.body
    let castArray = req.body.cast.split(', ')
    movieObj.cast = castArray
    movieObj.year = +req.body.year // convert to number with unary operator (+)
    movieObj.origNominator = req.body.nominator
    movieObj.allNominators = [req.body.nominator]
    movieObj.nominations = []
    movieObj.screened = false
    console.log(movieObj)
    Movie.create(movieObj, (err, createdMovie) => {
        err ? console.log(err) : console.log('Movie created: ' + createdMovie);
        nomObj.nominee = createdMovie._id
        Nomination.create(nomObj, (err, createdNomination) => {
          if(err) console.log(err);
          res.redirect('/nominations');
        })
    })
  }

    // Nomination.create(req.body, (err, newNomination) => {
    //   if(err) {console.log(err.message);}
    //   else { res.redirect('/nominations/index.ejs')}
    // })
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
    Nomination.findById(req.params.id, (err, foundNom) => {
      res.render('nominations/edit.ejs', {
        tabTitle: foundNom.title + " | Edit Nomination",
        nomination: foundNom
      })
    }).populate("screening").populate("nominee")
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
    let date = new Date(req.body.forWhatScreening)
    console.log('original date: ' + date.toString())
    formattedDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
    console.log('Date with UTC params: ' + formattedDate.toString());
    req.body.forWhatScreening = formattedDate
    console.log(req.body.winner)
    let checked = req.body.winner === "on" ? true : false
    req.body.winner = checked
    Nomination.findByIdAndUpdate(req.params.id, req.body, (err, foundNomination) => {
      res.redirect('/nominations')
    })
  })


  

module.exports = router