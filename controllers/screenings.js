const express = require('express')
const { models } = require('mongoose')
const router = express.Router()

const Screening = require('../models/screening')
const screeningWeeks = require('../models/screening_weeks')
const screeningWeeksSeed = require('../models/seed_screening_weeks')


//INDEX
router.get('/', (req, res) => {
    Screening.find({}, (err, allScreenings) => {  
        res.render('screenings/index.ejs', {
            tabTitle: 'FFS Screenings',
            screenings: allScreenings,
            screeningWeeks: screeningWeeks
        })
    })
})

//JSON
//Spit out date objects from start of FFS and every 14 days after
router.get('/json/screening_weeks', (req, res) => {
    res.json(screeningWeeks)
})

//Return the seed data for screening weeks, with LOTR days excluded
router.get('/json/screening_weeks/seed', (req, res) => {
    res.json(screeningWeeksSeed)
})


//NEW
router.get('/new', (req, res) => {
    res.render('screenings/new.ejs', {
        tabTitle: 'Add New Screening Info',
        weeks: screeningWeeksSeed
    })
})

//CREATE
router.post('/', (req, res) => {
    req.body.weekID = req.body.screeningNumAndDate
    req.body.date = screeningWeeksSeed[req.body.screeningNumAndDate]
    Screening.create(req.body, (err, createdScreening) => {
        err ? console.log(err) : console.log(createdScreening)
        res.json(createdScreening)
    })
    // res.json(req.body)
})

module.exports = router