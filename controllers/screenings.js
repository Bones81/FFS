const express = require('express')
const { models, default: mongoose } = require('mongoose')
const router = express.Router()

const Screening = require('../models/screening')
const screeningWeeks = require('../models/screening_weeks')
const screeningWeeksSeed = require('../models/seed_screening_weeks')


const Movie = require('../models/movies')
const seedMoviesNew = require('../models/seed_movies_new')

const Nomination = require('../models/nominations')


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
    }).populate("selection").populate("nominations")
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
    }).populate("selection").populate("nominations")
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
    const screenObj = {...req.body}
    Screening.findOne({}).sort({weekID: -1}).exec((err, foundScreening) => { //find screening w/ highest weekID, then +1 to create new weekID
        screenObj.weekID = foundScreening.weekID + 1
        //figure out date
        let date = new Date(screenObj.date)
        let dateTimeAt830 = date.getTime() + (1000*60*60*24.5)
        date = new Date(dateTimeAt830)
        screenObj.date = date
        Screening.create(screenObj, (err, createdScreening) => {
            err ? console.log(err) : console.log(createdScreening)
            res.redirect('/screenings')
        })
    }) 
})

//SHOW
router.get('/:id', (req, res) => {
    Screening.findById(req.params.id).populate("selection").exec((err, foundScreening) => {
        res.render('screenings/show.ejs', {
            tabTitle: foundScreening.date.toString().slice(3,15) + " FFS Screening",
            screening: foundScreening
        })
    })
})

//EDIT
router.get('/:id/edit', (req, res) => {
    Screening.findById(req.params.id).populate("selection").populate("nominations").exec((err, foundScreening) => {
        let date = new Date(foundScreening.date)
        let dateTime = date.getTime()
        dateTime -=(1000 * 60 * 60 * 4)
        date = new Date(dateTime)
        date = date.toISOString().slice(0,10)
        res.render('screenings/edit.ejs', {
            tabTitle: "Edit " + foundScreening.date.toString().slice(3,15) + " Screening",
            screening: foundScreening,
            date: date
        })
    })
})

//UPDATE
router.put('/:id', (req, res) => {
    let date = new Date(req.body.date)
    let dateTime = date.getTime() + (3600000 * 24.5)
    date = new Date(dateTime)
    req.body.date = date
    req.body.weekID = Number(req.body.weekID)
    Screening.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, updatedScreening) => {
        res.redirect('/screenings')
    })
    // res.json(req.body)

})

//CONFIRM DELETE
router.get('/:id/confirm-delete', (req, res) => {
    Screening.findById(req.params.id, (err, foundScreening) => {
        res.render('screenings/confirm_delete.ejs', {
        tabTitle: 'Confirm delete of Screening?',
        screening: foundScreening
        })
    })
})

//DELETE
router.delete('/:id', (req, res) => {
    console.log(req.params.id);
    Screening.findByIdAndRemove(req.params.id, (err, deletedScreening) => {
        if (err) console.log(err);
        console.log('Deleted screening: ' + deletedScreening);
        res.redirect('/screenings')
    })
})


module.exports = router