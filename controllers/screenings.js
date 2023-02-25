const express = require('express')
const { models, default: mongoose } = require('mongoose')
const router = express.Router()

const Screening = require('../models/screening')
const screeningWeeks = require('../models/screening_weeks')
const screeningWeeksSeed = require('../models/seed_screening_weeks')


const Movie = require('../models/movies')
const seedMoviesNew = require('../models/seed_movies_new')

const Nomination = require('../models/nominations')

const updateWeekIDs = () => {
    Screening.find({}, (err, allScreenings) => { 
        const dates = []
        for(let screening of allScreenings) { // for each screening, add its date to a list of all screening dates
            dates.push(screening.date)
        }
        // sort the dates chronologically
        dates.sort((a, b) => {
            if (a>b) {
                return 1
            } else {
                return -1
            }
        })

        for (let screening of allScreenings) { //assign weekIDs using order from sorted dates array
            Screening.findByIdAndUpdate(screening._id, {$set: {weekID: dates.indexOf(screening.date) + 1}}, {new: true}, (err, updatedScreening) => {
            })
        }
        console.log('weekIDs updated') ;
    })
}
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
    Screening.find({}).populate(//populate the selection and nominations fields
        [
            {
                path: 'selection', model: 'Movie'
            }, 
            {
                path: 'nominations', 
                model: 'Nomination', 
                populate: {
                    path: 'nominee', 
                    model: 'Movie'
                }
            }
        ]
    ).exec((err, allScreenings) => { 
        //put the screenings in chronological order
        allScreenings.sort( (a,b) => {
            if (a.weekID > b.weekID) { return 1 } else { return -1 }
        })
        res.render('screenings/index.ejs', {
            tabTitle: 'FFS Screenings',
            screenings: allScreenings,
            screeningWeeks: screeningWeeks,
            
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
    }).populate("selection").populate("nominations")
})

router.get('/:id/json', (req, res) => {
    Screening.findById(req.params.id, (err, foundScreening) => {
        res.json(foundScreening);
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
    const screenObj = {...req.body}
    //figure out date
    let date = new Date(screenObj.date)
    let dateTimeAt830 = date.getTime() + (1000*60*60*24.5)
    date = new Date(dateTimeAt830)
    screenObj.date = date
    Screening.find({}, (err, allScreenings) => {
        const dates = [screenObj.date]
        for(let screening of allScreenings) { // for each screening, add its date to a list of all screening dates
            dates.push(screening.date)
        }
        // sort the dates chronologically
        dates.sort((a, b) => {
            if (a>b) {
                return 1
            } else {
                return -1
            }
        })

        // console.log(dates.indexOf(screenObj.date) + 1);
        for (let screening of allScreenings) {
            Screening.findByIdAndUpdate(screening._id, {$set: {weekID: dates.indexOf(screening.date) + 1}}, {new: true}, (err, updatedScreening) => {
                console.log('weekID ' + updatedScreening.weekID + ' assigned to ' + screening.date) ;
            })
        }

        // assign the correct weekID to the new screening object
        screenObj.weekID = dates.indexOf(screenObj.date) + 1
        //finally, create the new screening
        Screening.create(screenObj, (err, createdScreening) => {
            err ? console.log(err) : console.log(createdScreening)
            res.redirect('/screenings')
        })
    })

    // Screening.findOne({}).sort({weekID: -1}).exec((err, foundScreening) => { //find screening w/ highest weekID, then +1 to create new weekID; this assumes user is only adding new screenings in chronological order
    //     // need to change to dynamically assign weekID based on when new screening falls. If it falls before any existing screening, reassign weekIDs to all screenings that come after the new screening chronologically.
    //     screenObj.weekID = foundScreening.weekID + 1
    //     Screening.create(screenObj, (err, createdScreening) => {
    //         err ? console.log(err) : console.log(createdScreening)
    //         res.redirect('/screenings')
    //     })
    // }) 
})

//SHOW
router.get('/:id', (req, res) => {
    Screening.findById(req.params.id).populate(
        [
            {
                path: 'selection',
                model: 'Movie'
            },
            {
                path: 'nominations',
                model: 'Nomination',
                populate: {
                    path: 'nominee',
                    model: 'Movie'
                }
            }
        ]).exec((err, foundScreening) => {
        res.render('screenings/show.ejs', {
            tabTitle: foundScreening.date.toString().slice(3,15) + " FFS Screening",
            screening: foundScreening
        })
    })
})

//EDIT
router.get('/:id/edit', (req, res) => {
    Screening.findById(req.params.id).populate(
        [
            {
                path: 'selection',
                model: 'Movie'
            },
            {
                path: 'nominations',
                model: 'Nomination',
                populate: {
                    path: 'nominee',
                    model: 'Movie'
                }
            }
        ]
    ).exec((err, foundScreening) => {
        //The logic below generates the date in the correct format to preset it in the Date of Screening field in edit.ejs
        let date = new Date(foundScreening.date)
        let dateTime = date.getTime()
        dateTime -=(1000 * 60 * 60 * 4)
        date = new Date(dateTime)
        date = date.toISOString().slice(0,10)
        console.log('screening.selection = ' + foundScreening.selection);
        console.log('screening.nominations = ' + foundScreening.nominations);
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
    if (req.body.selection === "") {
        req.body.selection = null
    }
    Screening.findById(req.params.id, (err, foundScreening) => {
        req.body.nominations = foundScreening.nominations;
        // res.json(req.body)
        Screening.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, updatedScreening) => {
            // if there is a new selection value, update the related nominations and movies

            
            console.log('Screening updated: ' + updatedScreening);
            //now adjust weekIDs to reflect any updated dates
            updateWeekIDs();
            res.redirect('/screenings')
        })
    })
    // Screening.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, updatedScreening) => {
    //     res.redirect('/screenings')
    // })

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
    console.log('screening id: ' + req.params.id);
    Screening.findByIdAndRemove(req.params.id, (err, deletedScreening) => {
        // find and delete any related nominations with this screening
        for (let nomination of deletedScreening.nominations) {
            Nomination.findByIdAndRemove(nomination._id, (err, deletedNom) => {
                if (err) console.log(err);
                console.log('Deleted nomination associated with deleted screening: ' + deletedNom);
                if (deletedNom && deletedNom.winner) { //if nominee was a winner, reset the movie to not be a winner; also remove nominee and nominator from respective arrays.
                    Movie.findByIdAndUpdate(deletedNom.nominee, {$set: {screened: false}}, {$unset: {screening: null}}, {$pull: {nominations: deletedNom._id}}, {$pull: {allNominators: deletedNom.nominator}}, {new: true}, (err, updatedMovie) => {
                        if (err) console.log(err);
                        console.log('Nomination removed for movie: ' + updatedMovie);
                    })
                } else if (deletedNom) { //remove nomination and nominator from respective lists, and check if any noms/nominators remain
                    console.log(deletedNom.nominee);
                    Movie.findByIdAndUpdate(deletedNom.nominee, {$pull: {nominations: deletedNom._id}}, {$pull: {allNominators: deletedNom.nominator}}, {new: true}, (err, updatedMovie) => {
                        if (err) console.log(err);
                        if(!updatedMovie.allNominators) { // if this update removed the last remaining nomination, remove the origNominator as well
                            Movie.findByIdAndUpdate(deletedNom.nominee, {$set: {origNominator: ""}}, {new: true}, (err, updatedMovie2) => {
                                console.log('Nomination and origNominator removed for movie: ' + updatedMovie2);
                            })
                        } else {
                            console.log('Nomination removed for movie: ' + updatedMovie);
                        }
                    })
                } else {
                    console.log('The found nomination was no longer valid.');
                }
            })
        }
        //adjust weekIDs of remaining screenings as necessary using updateWeekIDs
        updateWeekIDs();
        if (err) console.log(err);
        console.log('Deleted screening: ' + deletedScreening);
        res.redirect('/screenings')
    })
})


// Movie.findByIdAndUpdate('63decff8a0d90f533efbf60e', {$set: {screened: false, screening: null, nominations: [], allNominators: []}}, {new: true}, (err, updatedM) => {
//     if(err) console.log(err);
//     console.log(updatedM); 
// })

// Screening.findOneAndUpdate({weekID: 72}, {nominations: ["63e91aa8b420431ccea0042a"]}, {new: true}, (err, foundScreening) => {
//     console.log(foundScreening);
// })

module.exports = router