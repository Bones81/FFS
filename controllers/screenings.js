const express = require('express')
const { models, default: mongoose } = require('mongoose')
const router = express.Router()

const Screening = require('../models/screening')
const screeningWeeks = require('../models/screening_weeks')
const screeningWeeksSeed = require('../models/seed_screening_weeks')


const Movie = require('../models/movies')
const seedMoviesNew = require('../models/seed_movies_new')


//REMOVE LAST SCREENING
// Screening.findByIdAndRemove("633e8748e26cc37fe711d20f", (err, deletedScreen) => {
//     console.log(deletedScreen);
// })

//FIXING THE MOVIE OBJECT IDS ASSOCIATED WITH SCREENINGS
// for (let movie of seedMovies) {
//     Movie.findOne({title: movie.title}, (err, foundMovie) => {
//         Screening.findOneAndUpdate({selection: movie}, {$set: {selection: foundMovie}}, {new: true}, (err, updatedScreening) => {
//             console.log(updatedScreening);
//         })
//     })
// }

// Movie.find({}, (err, allMovies) => {
//     for (let movie of allMovies) {

//             Screening.findOneAndUpdate({selection: foundMovie}, {$set: {selection: movie}}, {new: true}, (err, updatedScreening) => {
//                 console.log(updatedScreening);
//             })
//     }
// }) 


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

// Screening.find({}).populate("selection").exec((err, allScreenings) => {
//     console.log(allScreenings);
// })


// const createScreening = (screening) => {
//     return Screening.create(screening).then((docScreening) => {
//         console.log("\n>> Created Screening:\n", docScreening);
//         return docScreening
//     })
// }

// const createMovie = (movie) => {
//     console.log("\n>> Adding Movie to DB:\n", movie);
//     return Movie.create(movie).then((createdMovie) => {
//         console.log('>> Movie created:' + createdMovie);
//         return createdMovie
//     })
// }

// const setSelection = (screeningID, selection) => {
//     console.log("\n>> Adding Selection to Screening...\n");
//     return Screening.findByIdAndUpdate(screeningID, {$set: {selection: selection}}, {new: true}).then((updatedScreening) => {
//         console.log('>>Screening updated: ' + updatedScreening);
//         return updatedScreening
//     })
// }

// const run = async () => {
//     let [screening, movie] = await Promise.all([
//         createScreening({
//             weekID: 0,
//             date: new Date("2000-01-01T20:30:00Z"),
//             selection: undefined,
//             notes: "Test comment",
//             nominations: []
//         }), createMovie({
//             title: "Anchorman",
//             screened: true,
//             year: 2004,
//             director: 'Adam McKay',
//             cast: ["Will Ferrell","Christina Applegate","Fred Willard","Steve Carrell","Paul Rudd", "David Koechner", "Vince Vaughan", "Jack Black", "Danny Trejo", "Chris Parnell"],
//             origNominator: "Nathan",
//             allNominators: ["Nathan"],
//             nominations: [],
//             genre: ["Comedy"]
//         })
//     ])

//     setSelection(screening._id, movie)
// }

// run()

    



//TO DELETE TEST SCREENINGS
// Screening.deleteMany({weekID: '0'}, (err, deletedScreenings) => {
//     err ? console.log(err) : console.log(deletedScreenings);
// })

//TO DELETE TEST MOVIES
// Movie.deleteMany({title: 'Anchorman'}, (err, deletedMovies) => {
//     err ? console.log(err) : console.log(deletedMovies);
// })

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
    }).populate("selection")
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
    }).populate("selection")
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