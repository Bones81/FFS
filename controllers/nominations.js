const express = require('express')
const router = express.Router()

const Nomination = require('../models/nominations')
const nominationSeed = require('../models/seed_nominations')


//JSON
router.get('/json', (req, res) => {
  Nomination.find({}, (err, nominations) => {
    res.json(nominations)
  })
})


//INDEX
router.get('/', (req, res) => {
    Nomination.find({}, (err, nominations) => {
      res.render('nominations/index.ejs', {
        tabTitle: 'FFS Nominations',
        nominations: nominations
      })
    })
})

//NEW
router.get('/new', (req, res) => {
    res.render('nominations/new.ejs', {
      tabTitle: 'Add Nomination'
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