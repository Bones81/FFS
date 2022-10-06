const express = require('express')
const { models, default: mongoose } = require('mongoose')
const router = express.Router()

const Screening = require('../models/screening')
const screeningWeeks = require('../models/screening_weeks')
const screeningWeeksSeed = require('../models/seed_screening_weeks')

const seedMovies = require('../models/seed_movies')

//Mapping old list of winners to new screenings db, by checking for matching dates then adding movie._id
// for (let movie of seedMovies) {
//     movie.dateScreened = movie.dateScreened.slice(0,10)
//     // console.log(movie.dateScreened);
//     let newDateObj = new Date(movie.dateScreened)
//     newDateObj.setTime(newDateObj.getTime() + (1000 * 60 * 60 * 24.5)) //change to UTC time at 8:30pm ET
//     console.log(newDateObj);

//     Screening.find({}, (err, allScreenings) => {
//         err ? console.log(err) : console.log('All screenings accessed...');
//         for (let screening of allScreenings) {
//             // console.log(screening.date.toISOString().slice(0, 10));
//             if (screening.date.toISOString().slice(0, 10) === newDateObj.toISOString().slice(0, 10)) {
//                 // console.log(true);
//                 //assign movie to screening
//                 Screening.findByIdAndUpdate(screening._id, {$set: {selection: movie._id}}, {new: true}, (err, updatedScreening) => {
//                     console.log('Screenings updated');
//                 })
//             }
//         }
//     } )
// }

//CONTINUE SETTING UP 1-MANY RELATIONSHIP


//ATTEMPTING TO POPULATE "selection" field in screenings db

const createScreening = (screening) => {
    return Screening.create(screening).then((docScreening) => {
        console.log("\n>> Created Screening:\n", docScreening);
        return docScreening
    })
}

const createMovie = (screeningID, movie) => {
    console.log("\n>> Created Movie:\n", movie);
    return Screening.findByIdAndUpdate(screeningID, {$set: {selection: movie}}, {new: true})

}


// const screeningsSeed = screeningWeeksSeed.map((week, idx) => {
//     return {
//         weekID: idx + 1,
//         date: week,
//         notes: "",
//         selection: undefined,
//         nominations: []
//     }
// })

// console.log(screeningsSeed);


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

router.get('/json', (req, res) => {
    Screening.find({}, (err, allScreenings) => {
        err ? console.log(err) : console.log('All screenings found');;
        res.json(allScreenings)
    })
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
    Screening.create(req.body, (err, createdScreening) => {
        err ? console.log(err) : console.log(createdScreening)
        res.json(createdScreening)
    })
    // res.json(req.body)
})

module.exports = router