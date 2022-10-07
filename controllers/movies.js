const express = require('express')
const router = express.Router()

const Movie = require('../models/movies')
const movieSeed = require('../models/seed_movies')
const seedMoviesNew = require('../models/seed_movies_new')

router.get('/', (req, res) => {
    Movie.find({}, (err, allMovies) => {
        err ? console.log(err) : console.log('All movies found');
        res.json(allMovies)
    })
})

router.get('/json', (req, res) => {
    Movie.find({}, (err, movies) => {
      res.json(movies)
    })
  })

router.get('/json/seed_movies_new', (req, res) => {
    res.json(seedMoviesNew)
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


//CREATE
router.post('/movies', (req, res) => {
    //LIKELY WILL NEED TO MODIFY REQ.BODY HERE BEFORE RUNNING THE CREATE COMMAND
    Movie.create(req.body, (err, allMovies) => {
        err ? console.log(err) : console.log(allMovies);
    })
})


//DROP COLLECTION -- CAUTION!!!!!!!!!
// Movie.collection.drop()

module.exports = router