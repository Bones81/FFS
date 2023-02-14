const express = require('express')
const res = require('express/lib/response')
const router = express.Router()

const Movie = require('../models/movies')
const seedMoviesNew = require('../models/seed_movies_new')
const Nomination = require('../models/nominations')
const Screening = require('../models/screening')
const screeningSeed = require('../models/seed_screenings')

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
    'Holiday',
    'Horror',
    'Rom-Com',
    'Satire',
    'Science Fiction',
    'Thriller',
    'Video Game-Based',
    'Western',
    'Other'
]

//ADD SCREENINGS TO EXISTING MOVIES IN MOVIES COLLECTION
// router.get('/addscreenings', (req, res) => {
//     for (let screening of screeningSeed) {
//         // console.log(typeof screening.selection);
//         if (typeof screening.selection === 'string') {
//             Movie.findByIdAndUpdate(screening.selection, {$set: {screening: screening}}, {new: true}, (err, updatedMovie) => {
//                 err ? console.log(err) : console.log('Movie updated with screening: ' + updatedMovie);
//             })
//         }
//     }
//     res.redirect('/movies')
// })

//JSON routes
router.get('/json', (req, res) => {
    Movie.find({}, (err, movies) => {
      res.json(movies)
    })
  })

router.get('/json/seed_movies_new', (req, res) => {
    res.json(seedMoviesNew)
})

router.get('/:id/json', (req, res) => {
    Movie.findById(req.params.id, (err, foundMovie) => {
        res.json(foundMovie)
    }) 
})

// MAP OVER OLD DATA TO NEW MOVIE SCHEMA
// const winningMovies = movieSeed
// // console.log(winningMovies)
// const formattedMovies = winningMovies.map(movie => {
//     const newMovieObj = {
//         title: movie.title, //name of movie
//         year: Number(movie.year), //year of movie's release
//         director: movie.director,
//         cast: movie.cast,
//         poster: movie.poster,
//         origNominator: null,
//         allNominators: [],
//         nominations: [],
//         screened: true
//     }
//     return newMovieObj
// })

//ADD A NEW PROPERTY
// Movie.find({}, (err, allMovies) => {
//     for (const movie of allMovies) {
//         movie.genre = []
//     }
// })

//SEED INITIAL MOVIE DATA
router.get('/seed', (req, res) => {
    // console.log(seedMoviesNew)
    Movie.create(seedMoviesNew, (err, data) => {
      console.log(data)
      if (err) console.log(err)
      console.log('added provided movie data')  
      res.redirect('/movies')
    })
})

//INDEX ROUTES
router.get('/', (req, res) => {
    Movie.find({}, (err, allMovies) => {  
        err ? console.log(err) : console.log('All movies found');
        // res.json(allMovies);
      res.render('movies/index.ejs', {
        tabTitle: 'The Fortnightly Film Society Website',
        movies: allMovies
      })
    }).populate("nominations").populate("screening")
  })
  

//NEW
router.get('/new', (req, res) => {
    res.render('movies/new.ejs', {
      tabTitle: 'Add Movie',
      genres: genres
    })
  })

//CREATE
router.post('/', (req, res) => {
    let movieObj = req.body
    let castArray = req.body.cast.split(', ')
    movieObj.cast = castArray
    movieObj.year = +req.body.year // convert to number with unary operator (+)
    movieObj.origNominator = ""
    movieObj.allNominators = []
    movieObj.nominations = []
    movieObj.screened = false
    console.log(movieObj)
    Movie.create(movieObj, (err, createdMovie) => {
        err ? console.log(err) : console.log('Movie created: ' + createdMovie);
        res.redirect('/movies')
    })
})

//CONFIRM DELETE ROUTES
router.get('/:id/confirm-delete', (req, res) => {
    Movie.findById(req.params.id, (err, foundMovie) => {
        res.render('movies/confirm_delete.ejs', {
        tabTitle: 'Confirm delete?',
        movie: foundMovie
        })
    })
})
  
  //DELETE ROUTES
router.delete('/:id', (req, res) => {
    // first find and delete all nominations associated with the movie
    Movie.findById(req.params.id, (err, foundMovie) => {
        if (foundMovie.nominations) {
            for (let nom of foundMovie.nominations) {
                Nomination.findByIdAndRemove(nom._id, (err, deletedNomination) => {
                    // update Screening nomination data as well
                    Screening.findByIdAndUpdate(deletedNomination.screening._id, {$pull: {nominations: deletedNomination._id}}, {new: true}, (err, updatedScreening) => {
                        console.log('Removed nomination from screening: ' + updatedScreening); 
                    })
                    console.log('deleted associated nomination: ' + deletedNomination)
                })
            }
        }
        //include code to update any screening that might have been associated with the movie? - very edge case
        if(foundMovie.screened) {
            Screening.findOneAndUpdate({selection: foundMovie._id}, {$set: {selection: null}}, {new: true}, (err, updatedScreening) => {
                console.log('reset selection for screening ' + updatedScreening.weekID); 
            })
        }
        // then remove the movie itself
        Movie.findByIdAndRemove(req.params.id, (err, deletedMovie) => {
            console.log('Deleted movie: ' + deletedMovie);
            res.redirect('/movies')
        })
    })
})

//SHOW ROUTE
router.get('/:id', (req, res) => {
    Movie.findById(req.params.id).populate("screening").populate("nominations").exec((err, foundMovie) => {
        Nomination.find({nominee: foundMovie._id}, (err, foundNoms) => {
            Screening.findOne({selection: foundMovie._id}, (err, foundScreening) => {    
                res.render('movies/show.ejs', {
                    movie: foundMovie,
                    screening: foundScreening,
                    nominations: foundNoms,
                    tabTitle: foundMovie.title + ' | Show Page' 
                })
            })
        }).populate("nominee").populate("screening")
    })
})

//SEARCH RESULTS ROUTE
router.post('/search', (req, res) => {
    Movie.find({title: req.body.searchString}, (err, foundMovies) => {
        res.render('movies/index.ejs', { 
            movies: foundMovies,
            tabTitle: 'Search results'
        })
    })
})
  
//SORT ROUTE
router.post('/sort', (req, res) => {
    if (req.body.sortChoice === 'cast') {
        Movie.find({}, (err, allMovies) => {
        //
        const sortedMovies = allMovies.sort( (a, b) => {
            // console.log(a.cast[0].split(' ')[1])
            const namesOfA = a.cast[0].split(' ')
            const namesOfB = b.cast[0].split(' ')
            const lastNameA = namesOfA[namesOfA.length - 1]
            const lastNameB = namesOfB[namesOfB.length - 1]

            //below is the compare function that orders the list of movies by main actor's last name
            if(lastNameA > lastNameB) {
            return 1
            } else if (lastNameA < lastNameB) {
            return -1
            } else {
            return 0
            }
        })
        // res.send(sortedMovies)
        res.render('movies/index.ejs', {
            tabTitle: 'Sorted By ' + req.body.sortChoice,
            movies: sortedMovies
        })
        })
    } else if (req.body.sortChoice === 'director') {
        Movie.find({}, (err, allMovies) => {
        const sortedMovies = allMovies.sort((a, b) => {
            const aDirectorNames = a.director.split(' ')
            const bDirectorNames = b.director.split(' ')
            const lastNameOfDirA = aDirectorNames[aDirectorNames.length - 1]
            const lastNameOfDirB = bDirectorNames[bDirectorNames.length - 1]

            //below is the compare function that sorts the list of movies by director's last name
            if (lastNameOfDirA > lastNameOfDirB) {
            return 1
            } else if (lastNameOfDirA < lastNameOfDirB) {
            return -1
            } else {
            return 0
            }
        })
        //now that movies are sorted, render the page
        res.render('movies/index.ejs', {
            tabTitle: 'Sorted By ' + req.body.sortChoice,
            movies: sortedMovies
        })
        })
    } else if (req.body.sortChoice === 'most_recent') { 
        Movie.find({}).populate("screening").exec((err, allMovies) => {
        err ? console.log(err.message) : console.log('Sorting movies by most recent...');;
        const sortedMovies = allMovies.sort((a,b) => {
            if (a.screening && b.screening && a.screening.date < b.screening.date) {
            return 1
            } else if (a.screening && b.screening && a.screening.date > b.screening.date) {
            return -1 
            } else {
            return 0
            }
        })
        res.render('movies/index.ejs', {
            tabTitle: 'Sorted By ' + req.body.sortChoice,
            movies: sortedMovies
        })
        })
    } else if (req.body.sortChoice === 'screening_order') { 
        Movie.find({}).populate("screening").exec((err, allMovies) => {
        if(err) console.log(err.message);
        const sortedMovies = allMovies.sort((a,b) => {
            if (a.screening && b.screening && a.screening.date > b.screening.date) {
            return 1
            } else if (a.screening && b.screening && a.screening.date < b.screening.date) {
            return -1 
            } else {
            return 0
            }
        })
        res.render('movies/index.ejs', {
            tabTitle: 'Sorted By ' + req.body.sortChoice,
            movies: sortedMovies
        })
        })
    }else {
        Movie.find({}, null, {sort: req.body.sortChoice}, (err, sortedMovies) => {
            res.render('movies/index.ejs', {
                tabTitle: 'Sorted By ' + req.body.sortChoice,
                movies: sortedMovies
            })
        })
    }
})
  
//EDIT ROUTES
router.get('/:id/edit', (req, res) => {
    Movie.findById(req.params.id).populate("screening").exec((err, foundMovie) => {
        Screening.find({}, (err, allScreenings) => {
            allScreenings.sort((a,b) => {
                if(a.date > b.date) { return 1 } else { return -1 }
            })
            res.render('movies/edit.ejs', {
                tabTitle: foundMovie.title + " | Edit Page",
                movie: foundMovie,
                screenings: allScreenings,
                genres: genres
            })
        })
    })
})

//PUT ROUTES
router.put('/:id', (req, res) => {

    const updateMovie = () => {
        console.log('req.body when starting update movie function: ');
        console.log(req.body);
        Movie.findByIdAndUpdate(req.body.id, req.body, {new: true}, (err, updatedMovie) => {
            err ? console.log(err) : null;
            //find the nomination associated with the screening/movie combination
            //find Screening first
            if (updatedMovie.screening) { // if the movie is to be associated with a screening...
                Screening.findByIdAndUpdate(updatedMovie.screening._id, {selection: updatedMovie._id}, {new: true}, (err, updatedScreening) => { //update that screening
                    // what if no Screening is found?
                    err ? console.log(err) : console.log("The associated screening is now updated: " + updatedScreening);
                    if (updatedScreening.nominations.length) { // if there are nominations linked to that screening, find the one that needs to be updated
                        //then find the Nomination related to that movie/screening and update its winner status
                        Nomination.findOneAndUpdate({nominee: updatedMovie._id, screening: updatedScreening._id}, {winner: req.body.screened}, {new: true}, (err, updatedNomination) => { // whether updating to winner or non-winner, req.body.screened should hold the appropriate value
                            err ? console.log(err) : null;
                            console.log("The now updated Nomination is: " + updatedNomination); 
                        })
                    } else { // edge case where no nomination exists for the screening, even though it's being updated vis-a-vis having a screening
                        console.log('No related nominations to update.');
                    }
                    //if the updated screening is not the same as the original screening, update the original screening too
                    if(req.body.origScreening && updatedScreening.id !== req.body.origScreening._id) {
                        Screening.findByIdAndUpdate(req.body.origScreening._id, {$set: {selection: null}}, {new: true}, (err, updatedOrigScreening) => {
                            console.log('Original Screening updated to remove selection: ' + updatedOrigScreening);
                            //additionally, update the related nomination for the movie and the origScreening
                            Nomination.findOneAndUpdate({nominee: updatedMovie._id, screening: updatedOrigScreening._id}, {winner: false}, {new: true}, (err, updatedOrigNomination) => { //find the nominee that had been marked a winner before the update and change it
                                console.log('Original Nomination changed winner status: ' + updatedOrigNomination);
                            })
                        })
                    } 
                    // if above is not true, it means that the screening it was linked to stayed the same and that condition is already handled
                    // so we can just log out the updatedMovie and be done with this branch
                    console.log('Updated movie: ' + updatedMovie);
                    res.redirect('/movies')
                })
            } else { // the movie is not to be associated with a screening. Either it was associated with one prior to the update, or it wasn't ever associated with a screening.
                if (req.body.origScreening) { //if it was originally associated with a screening and now is not...
                    Screening.findByIdAndUpdate(req.body.origScreening._id, {$set: {selection: null}}, {new: true}, (err, updatedOrigScreening) => { //find the screening and unset its selection
                        console.log('Original Screening updated to remove selection: ' + updatedOrigScreening);
                        //additionally, update the related nomination for this movie and that screening
                        Nomination.findOneAndUpdate({nominee: updatedMovie._id, screening: updatedOrigScreening._id}, {winner: false}, {new: true}, (err, updatedOrigNomination) => { 
                            console.log('Original Nomination changed to non-winner: ' + updatedOrigNomination);
                        })
                    })
                } else { // movie remains unassociated with any screening. No additional updates needed.
                    console.log('Movie remains unassociated with any screening. No additional updating of screenings or nominations necessary.');
                    console.log('req.body.origScreening = ' + req.body.origScreening);
                }
                console.log('Finally, the updated movie: ' + updatedMovie);
                res.redirect('/movies')
            }
        })
        // Movie.findById(req.params.id, (err, foundMovie) => { 
        //     console.log('line 318: ' + foundMovie);
        //     if (req.body.screening) { // if updating movie to associate with an existing screening, first update associated Screening and Nomination
        //         Screening.findByIdAndUpdate(foundMovie.screening._id, {$set: {selection: foundMovie._id}}, {new: true}, (err, updatedScreening) => {
        //             // find nomination associated with that screening and make it a winning nom
        //             Nomination.findOneAndUpdate({screening: foundMovie.screening._id}, {winner: true}, {new: true}, (err, updatedNomination) => {
        //                 if (!updatedNomination) {
        //                     console.log('Associated nomination not found.');
        //                 } else {
        //                     console.log('Changed winner status of associated nomination - now true: ' + updatedNomination);
        //                     Movie.findByIdAndUpdate(req.params.id, req.body, (err, updatedMovie) => {
        //                         console.log('Finally updated movie: ' + updatedMovie); 
        //                     })
        //                 }
        //             })
        //             console.log('Updated screening: ' + updatedScreening)
        //             res.redirect('/movies')
        //         })
        //     } else { // if disassociating movie from any screening, update appropriate screening and change associated nomination to non-winner
        //         Screening.findOneAndUpdate({weekID: req.body.origWeekID}, {$set: {selection: null}}, {new: true}, (err, updatedScreening) => {
        //             !updatedScreening ? console.log('Screening not found') : console.log('Screening found! ' + updatedScreening.weekID);
        //             err ? console.log(err) : console.log('screening updating: ' + updatedScreening);
        //             Nomination.findOneAndUpdate({screening: updatedScreening._id}, {winner: false}, {new: true}, (err, updatedNomination) => {
        //                 err ? console.log(err) : console.log('related nomination updating...');
        //                 if (!updatedNomination) {
        //                     console.log('Associated nomination not found.');
        //                 } else {
        //                     console.log('Changed winner status of associated nomination - now false: ' + updatedNomination);
        //                     Movie.findByIdAndUpdate(req.params.id, req.body, (err, updatedMovie) => {
        //                         console.log('Finally updated movie: ' + updatedMovie); 
        //                     })
        //                 }
        //             })
        //         })
        //     }
        // })

        // Movie.findByIdAndUpdate(req.params.id, {$unset: {screening: ""}}, {new: true}, (err, updatedMovie) => {  
        //     // console.log('After unset: ' + updatedMovie);
        //     // console.log(req.body);
        //     Movie.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, foundMovie) => {
        //         // console.log('Movie data updated: ' + foundMovie);
        //         if(req.body.screening) {  // if movie is being updated to have an associated screening
        //             Screening.findByIdAndUpdate(foundMovie.screening._id, {$set: {selection: foundMovie}}, {new: true}, (err, updatedScreening) => {
        //                 // find nomination associated with that screening and make it a winning nom
        //                 Nomination.findOneAndUpdate({screening: foundMovie.screening._id}, {winner: true}, {new: true}, (err, updatedNomination) => {
        //                     if (!updatedNomination) {
        //                         console.log('Associated nomination not found.');
        //                     } else {
        //                         console.log('Changed winner status of associated nomination - now true: ' + updatedNomination);
        //                     }
        //                 })
        //                 console.log('Also updated screening: ' + updatedScreening)
        //                 res.redirect('/movies')
        //             })
        //         } else { // if movie is being updated to unassociate with any screening
        //             console.log('movie to unassociate with screening ' + foundMovie, foundMovie.screening);
        //             Screening.findOneAndUpdate({selection: foundMovie}, {$unset: {selection: ""}}, {new: true}, (err, updatedScreening) => {
        //                 //find nomination associated with screening and make it a non-winner
        //                 console.log(updatedScreening._id);
        //                 Nomination.findOneAndUpdate({nominee: foundMovie._id, screening: updatedScreening._id}, {winner: false}, {new: true}, (err, updatedNomination) => {
        //                     if(!updatedNomination) {
        //                         console.log('Associated nomination not found.');
        //                     } else {
        //                         console.log('Changed winner status of associated nomination - now false: ' + updatedNomination);
        //                     }
        //                 })
        //                 console.log('Also removed movie from screening: ' + updatedScreening)
        //             })
        //             res.redirect('/movies')
        //         }
        //     })
        // })
    }
    //ABOVE EVENTUALLY NEEDS LOGIC TO HANDLE INSTANCE WHERE ANOTHER MOVIE IS ALREADY ASSIGNED TO A SCREENING.
    console.log('Initial req.body: '); 
    console.log(req.body);
    req.body.cast = req.body.cast.split(', ')
    req.body.year = +req.body.year
    // req.body.origWeekID !== req.body.screening ? req.body.changed = true : req.body.changed = false;
    if(req.body.screening) { // if the update involves a screening to associate the movie with
        req.body.screening = +req.body.screening
        req.body.screened = true
        Screening.findOne({weekID: req.body.screening}, (err, foundScreening) => {
            req.body.screening = foundScreening._id
            Screening.findOne({weekID: +req.body.origWeekID}, (err, origScreening) => {
                req.body.origScreening = origScreening
                updateMovie()
            })
        })
    } else {
        req.body.screened = false
        //req.body.screening is an empty string in this conditional, so reset it to null
        req.body.screening = null //remember this corresponds to the screening's weekID
        req.body.origWeekID = +req.body.origWeekID
        if(req.body.origWeekID) { // if associated with a screening prior to update
            Screening.findOne({weekID: req.body.origWeekID}, (err, origScreening) => { // assign an origScreening._id
                req.body.origScreening = origScreening._id 
                updateMovie()
            })
        } else { // this condition means both the original and updated version of the movie are not associated with a screening
            req.body.origScreening = null
            updateMovie()
        }
    } 
})

// remove nominations/nominators from movie
// Movie.findByIdAndUpdate('6341124db86cd74b233755c0', {$set: {nominations: [], allNominators: [], origNominator: '', screening: null}}, {new: true}, (err, updatedMovie) => {
//     console.log(updatedMovie)
// })

//DROP COLLECTION -- CAUTION!!!!!!!!!
// Movie.collection.drop()

// const checkCastForActor = (actor) => {
//     Movie.find({cast: actor, screened: true}, (err, foundMovies) => {
//         for (let movie of foundMovies) {
//             console.log(actor + ' is in ' + movie.title);
//         }
//     })
// }

// let wf = "William Fichtner"
// let arnold = "Arnold Schwarzenegger"

// checkCastForActor(arnold)


const findWinningMoviesNoms = () => {
    Movie.find({screened: true}, (err, screenedMovies) => {
        for (let movie of screenedMovies) {
            if(movie.nominations.length) {
                console.log(movie.title, movie.origNominator);
            }
        }
    })
}

// findWinningMoviesNoms()


const fixSanta = () => {
    Movie.findOneAndUpdate({title: "Santa Claus Conquers the Martians"}, {$set: {allNominators: ["Ben Beckley-Chayes"]}}, {new: true}, (err, updatedMovie) => {
        console.log(updatedMovie);
    })
}
// fixSanta()
module.exports = router