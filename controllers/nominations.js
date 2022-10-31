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
      }) 
    })
  })
})

//NEW
router.get('/new', (req, res) => {
  Screening.find({}, (err, screenings) => {
    Movie.find({}, (err, movies) => {
      res.render('nominations/new.ejs', {
        tabTitle: 'Add Nomination',
        screenings: screenings,
        movies: movies,
        genres: genres,
        nominators: nominators
      })
    })
  })
})

//CREATE
router.post('/', (req, res) => {
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
    let checked = req.body.winner === "on" ? true : false
    req.body.winner = checked
    Nomination.create(req.body, (err, newNomination) => {
      if(err) {console.log(err.message);}
      else { res.redirect('/nominations/index.ejs')}
    })
})

//SHOW
router.get('/:id', (req, res) => {
    Nomination.findById(req.params.id, (err, foundNomination) => {
      res.render('nominations/show.ejs', {
        nomination: foundNomination,
        tabTitle: foundNomination.title + ' | Nomination' 
      })
    })
})


//EDIT
router.get('/:id/edit', (req, res) => {
    Nomination.findById(req.params.id, (err, foundNom) => {
      res.render('nominations/edit.ejs', {
        tabTitle: foundNom.title + " | Edit Nomination",
        nomination: foundNom
      })
    })
})

//CONFIRM DELETE
router.get('/:id/confirm-delete', (req, res) => {
    Nomination.findById(req.params.id, (err, foundNom) => {
      res.render('nominations/confirm_delete.ejs', {
        tabTitle: 'Confirm delete?',
        nomination: foundNom
      })
    })
})
  
//DELETE
router.delete('/:id', (req, res) => {
    Nomination.findByIdAndRemove(req.params.id, (err, foundNomination) => {
      res.redirect('/nominations/index.ejs')
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