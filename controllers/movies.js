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
                 console.log('deleted ' + deletedNomination)
            })
        }
      }
      //include code to update any screening that might have been associated with the movie? - very edge case
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
        // console.log(req.params.id, req.body);
        Movie.findByIdAndUpdate(req.params.id, {$unset: {screening: ""}}, {new: true}, (err, updatedMovie) => {  
            // console.log('After unset: ' + updatedMovie);
            Movie.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, foundMovie) => {
                // console.log('Movie data updated: ' + foundMovie);
                if(req.body.screening) { 
                    Screening.findByIdAndUpdate(foundMovie.screening._id, {$set: {selection: foundMovie}}, {new: true}, (err, updatedScreening) => {
                        console.log('Also updated screening: ' + updatedScreening)
                        res.redirect('/movies')
                    })
                } else {
                    console.log('movie to unassociate with screening ' + foundMovie);
                    Screening.findOneAndUpdate({selection: foundMovie}, {$unset: {selection: ""}}, {new: true}, (err, updatedScreening) => {
                        console.log('Also removed movie from screening: ' + updatedScreening)
                    })
                    res.redirect('/movies')
                }
            })
        })
    }
    //ABOVE EVENTUALLY NEEDS LOGIC TO HANDLE INSTANCE WHERE ANOTHER MOVIE IS ALREADY ASSIGNED TO A SCREENING.

    req.body.cast = req.body.cast.split(', ')
    req.body.year = +req.body.year
    console.log(req.body);
    if(req.body.screening) {
        req.body.screening = +req.body.screening
        req.body.screened = true
        Screening.findOne({weekID: req.body.screening}, (err, foundScreening) => {
            req.body.screening = foundScreening
            updateMovie()
        })
    } else {
        req.body.screened = false
        req.body.screening = undefined
        updateMovie()
    }
})

// remove nominations/nominators from movie
// Movie.findByIdAndUpdate('6341124db86cd74b233755c0', {$set: {nominations: [], allNominators: [], origNominator: '', screening: null}}, {new: true}, (err, updatedMovie) => {
//     console.log(updatedMovie)
// })

//DROP COLLECTION -- CAUTION!!!!!!!!!
// Movie.collection.drop()

const checkCastForActor = (actor) => {
    Movie.find({cast: actor, screened: true}, (err, foundMovies) => {
        for (let movie of foundMovies) {
            console.log(actor + ' is in ' + movie.title);
        }
    })
}

let wf = "William Fichtner"
let arnold = "Arnold Schwarzenegger"

checkCastForActor(arnold)

module.exports = router