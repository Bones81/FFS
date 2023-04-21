const express = require('express')
const res = require('express/lib/response')
const router = express.Router()

const Movie = require('../models/movies')
const seedMoviesNew = require('../models/seed_movies_new')
const Nomination = require('../models/nominations')
const seedNominations = require('../models/seed_nominations')
const Screening = require('../models/screening')
const seedScreenings = require('../models/seed_screenings')

const genres = require('../models/genres')
const nominators = require('../models/nominators')
const ffsActors = require('../models/actors')

const { trusted } = require('mongoose')

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

// //SEED INITIAL MOVIE DATA
// router.get('/seedmovies', (req, res) => {
//     // console.log(seedMoviesNew)
//     Movie.create(seedMoviesNew, (err, data) => {
//       if (err) console.log(err)
//       for (let movie of data) {
//         console.log('movie added: ' + movie.title);
//       }
//       console.log('added provided movie data')  
//       res.redirect('/movies')
//     })
// })

// //SEED NOMINATION DATA
// router.get('/seednominations', (req, res) => {
//     // console.log(seedNominations)
//     Nomination.create(seedNominations, (err, data) => {
//       if (err) console.log(err)
//       for (let nom of data) {
//         console.log('nom added: ' + nom.blurb);
//       }
//       console.log('added provided nomination data')  
//       res.redirect('/nominations')
//     })
// })

// //SEED SCREENINGS DATA
// router.get('/seedscreenings', (req, res) => {
//     // console.log(seedScreenings)
//     Screening.create(seedScreenings, (err, data) => {
//       if (err) console.log(err)
//       for (let screening of data) {
//         console.log('screening added: ' + screening.weekID);
//       }
//       console.log('added provided screening data')  
//       res.redirect('/screenings')
//     })
// })

//INDEX ROUTES
router.get('/', (req, res) => {
    Movie.find({}, (err, allMovies) => {  
    err ? console.log(err) : console.log('All movies found');
    // res.json(allMovies);
        res.render('movies/index.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'The Fortnightly Film Society Website',
            movies: allMovies, 
            genres: genres,
            nominators: nominators, 
            actors: ffsActors
        })
        }).populate("nominations").populate("screening")
  })
  

//NEW
router.get('/new', (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            tabTitle: 'Not Authorized',
            user: req.user,
            sessionID: req.sessionID
        })
    } else {
        res.render('movies/new.ejs', {
        user: req.user,
        sessionID: req.sessionID,
        tabTitle: 'Add Movie',
        genres: genres
        })
    }
  })

//CREATE
router.post('/', (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            tabTitle: 'Not Authorized',
            user: req.user,
            sessionID: req.sessionID
        })
    } else {
        let movieObj = req.body
        let castArray = req.body.cast.split(', ')
        movieObj.cast = castArray
        movieObj.year = +req.body.year // convert to number with unary operator (+)
        movieObj.origNominator = ""
        movieObj.allNominators = []
        movieObj.nominations = []
        movieObj.screened = false
        console.log(movieObj)
        Movie.find({}, (err, allMovies) => {
            for (let movie of allMovies) {
                if (movie.title === req.body.title) {
                    res.send("<h1>Cannot create movie. Movie's title already exists in database. Check existing movie list.<h1>")
                    return
                }
            }
            //assuming the user submitted a unique title
                Movie.create(movieObj, (err, createdMovie) => {
                    err ? console.log(err) : console.log('Movie created: ' + createdMovie);
                    res.redirect('/movies')
                })
        })
    }
})

//CONFIRM DELETE ROUTES
router.get('/:id/confirm-delete', (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'Not Authorized'
        })
    } else {
        Movie.findById(req.params.id, (err, foundMovie) => {
            res.render('movies/confirm_delete.ejs', {
            user: req.user,
            sessionID: req.sessionID,        
            tabTitle: 'Confirm delete?',
            movie: foundMovie
            })
        })
    }
})
  
  //DELETE ROUTES
router.delete('/:id', (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'Not Authorized'
        })
    } else {
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
    }
})

//SHOW ROUTE
router.get('/:id', (req, res) => {
        Movie.findById(req.params.id).populate("screening").populate("nominations").exec((err, foundMovie) => {
            Nomination.find({nominee: foundMovie._id}, (err, foundNoms) => {
                Screening.findOne({selection: foundMovie._id}, (err, foundScreening) => {    
                    res.render('movies/show.ejs', {
                        user: req.user,
                        sessionID: req.sessionID,
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
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'Not Authorized'
        })
    } else {
        Movie.find({title: req.body.searchString}, (err, foundMovies) => {
            res.render('movies/index.ejs', { 
                user: req.user,
                sessionID: req.sessionID,
                movies: foundMovies,
                tabTitle: 'Search results'
            })
        })
    }
})
  
//SORT ROUTE
router.post('/sort', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'Not Authorized'
        })
    } else {
        let allMovies = await Movie.find({})  
        switch(req.body.moviesSet) {
            case "all-movies":
                //"allMovies" means no filtering of allMovies necessary
                break;
            case "all-winners":
                //filter for only winning movies
                allMovies = allMovies.filter(x => x.screened)
                break;
            case "all-unscreened":
                //filter for only unscreened movies
                allMovies = allMovies.filter(x => !x.screened)
                break;
            case "non-winners":
                //filter for movies that have nominations but no wins
                allMovies = allMovies.filter(x => x.nominations.length && !x.screened)
                break;
            case "never-nominated":
                //filter for movies with 0 nominations
                allMovies = allMovies.filter(x => x.nominations.length === 0)
                break;
            case "nominated-by":
                //filter for movies nominated at any time by the specified nominator
                let nominator = req.body.nominator
                allMovies = allMovies.filter(x => x.allNominators.includes(nominator))
                break;
            case "orig-nom-by":
                //filter for movies with the indicated original nominator
                let origNominator = req.body.origNominator
                allMovies = allMovies.filter(x => x.origNominator === origNominator)
                break;
            case "includes-actor":
                //filter for movies with the indicated actor
                allMovies = allMovies.filter(x => x.cast.includes(req.body.actor))
                break;
            default:
                console.log('There was an error retrieving a value for the filter variable moviesSet.');  
        }
    
        //now apply any genre filter
        if(req.body.genresTypeChoice === "specific-genres") {
            // console.log(typeof req.body.genreChoice);
            if(!req.body.genreChoice) { //if user forgot to select at least one genre
                console.log('You must choose at least one genre.');
                req.body.genreChoice = []
            }
            if(typeof req.body.genreChoice === 'string') { //convert to array if only one genre submitted
                req.body.genreChoice = [req.body.genreChoice]
            }
            //function to determine if movie contains any of the selected genres
            const movieContainsAnySelectedGenre = (movie) => {
                for (let genre of req.body.genreChoice) {
                    if(movie.genre.includes(genre)) {
                        // console.log(genre + ' found in genres of ' + movie.title);
                        return true
                    }
                }
                return false
            }
                allMovies = allMovies.filter(x => movieContainsAnySelectedGenre(x))
        }
    
        //now apply sorting choice
        switch(req.body.sortChoice) {
            case "title":
                allMovies.sort((a,b) => {
                    if(a.title > b.title) {
                        return 1
                    } else {
                        return -1
                    }
                })
                break;
            case "director":
                allMovies.sort((a,b) => {
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
                break;
            case "year": 
                allMovies.sort((a,b) => {
                    if(a.year > b.year) {
                        return 1
                    } else if (b.year > a.year) {
                        return -1
                    } else { //if year is the same, sort by title
                        if(a.title > b.title) {
                            return 1
                        } else {
                            return -1
                        }
                    }
                })
                break;
            case "num-noms":
                allMovies.sort((a,b) => {
                    if(a.nominations.length === b.nominations.length) {
                        //if same number of noms, sort by title
                        if(a.title > b.title) {
                            return 1
                        } else {
                            return -1
                        } 
                    } else if (a.nominations.length > b.nominations.length) {
                        return -1    
                    } else {
                        return 1
                    }
                })
                break;
            default:
                console.log('There was a problem with the sorting choice.');
        }
    
        req.body.reverse === "on" ? allMovies = allMovies.reverse() : null
    
        console.log('Number of movies matching filters: ' + allMovies.length);
        if(allMovies.length) {
            console.log('first movie title: ' + allMovies[0].title);
            console.log('last movie title: ' + allMovies[allMovies.length-1].title);
        }
    
        //now that movies are filtered and sorted, render the page
        res.render('movies/index.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'FFS movies sorted by ' + req.body.sortChoice,
            movies: allMovies,
            nominators: nominators,
            genres: genres,
            actors: ffsActors
        })
    }
})
  
//EDIT ROUTES
router.get('/:id/edit', (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'Not Authorized'
        })
    } else {
        Movie.findById(req.params.id).populate("screening").exec((err, foundMovie) => {
            Screening.find({}, (err, allScreenings) => {
                allScreenings.sort((a,b) => {
                    if(a.date > b.date) { return 1 } else { return -1 }
                })
                res.render('movies/edit.ejs', {
                    user: req.user,
                    sessionID: req.sessionID,
                    tabTitle: foundMovie.title + " | Edit Page",
                    movie: foundMovie,
                    screenings: allScreenings,
                    genres: genres
                })
            })
        })
    }
})

//PUT ROUTES
router.put('/:id', (req, res) => {
    if (!req.isAuthenticated() || req.user.role === 'visitor') {
        res.render('no_access.ejs', {
            user: req.user,
            sessionID: req.sessionID,
            tabTitle: 'Not Authorized'
        })
    } else {
        const updateMovie = () => {
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
                        Screening.findByIdAndUpdate(req.body.origScreening._id, {$set: {selection: null}}, {new: true}, (err, updatedOrigScreening) => { //find the screening and nullify its selection
                            console.log('Original Screening updated to remove selection: ' + updatedOrigScreening);
                            //additionally, update the related nomination for this movie and that screening combination
                            Nomination.findOneAndUpdate({nominee: updatedMovie._id, screening: updatedOrigScreening._id}, {winner: false}, {new: true}, (err, updatedOrigNomination) => { 
                                console.log('Original Nomination changed to non-winner: ' + updatedOrigNomination);
                            })
                        })
                    } else { // movie remains unassociated with any screening. No additional updates needed.
                        console.log('Movie remains unassociated with any screening. No additional updating of screenings or nominations necessary.');
                        console.log('req.body.origScreening = ' + req.body.origScreening);
                    }
                    console.log('The updated movie: ' + updatedMovie);
                    res.redirect('/movies')
                }
            })
        }
        //ABOVE MAY EVENTUALLY NEED LOGIC TO HANDLE INSTANCE WHERE ANOTHER MOVIE IS ALREADY ASSIGNED TO A SCREENING.
        req.body.cast = req.body.cast.split(', ')
        req.body.year = +req.body.year
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
        } else { // if the update does not involve associating with a screening
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


module.exports = router