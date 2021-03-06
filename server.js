const express = require('express')
const app = express()

const mongoose = require('mongoose')
const db = mongoose.connection

const methodOverride = require('method-override')


app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(methodOverride('_method')) // enables use of _method attribute
require('dotenv').config()

const mongoURI = process.env.MONGODB_URI
const PORT = process.env.PORT || 3003

const seedMovies = require('./models/seed_movies.js')
const Movie = require('./models/movies.js')
const req = require('express/lib/request')
const res = require('express/lib/response')
const { aggregate } = require('./models/movies.js')
  
//SEED INITIAL MOVIE DATA
app.get('/movies/seed', (req, res) => {
  Movie.create(seedMovies, (err, data) => {
    console.log(data)
    if (err) console.log(err.message)
    console.log('added provided movie data')  
    res.redirect('/movies')
  })
})

//DROP COLLECTION
// Movie.collection.drop()

//JSON route
app.get('/movies/json', (req, res) => {
  Movie.find({}, (err, movies) => {
    res.json(movies)
  })
})

//HOME ROUTE
app.get('/', (req, res) => {
  res.redirect('/movies')
})

//INDEX ROUTE
app.get('/movies', (req, res) => {
  Movie.find({}, (err, allMovies) => {
    res.render('index.ejs', {
      tabTitle: 'Movies Home',
      movies: allMovies
    })
  })
})

//NEW ROUTE
app.get('/movies/new', (req, res) => {
  res.render('new.ejs', {
    tabTitle: 'Add Movie'
  })
})

//CREATE ROUTE
app.post('/movies', (req, res) => {
  let castArray = req.body.cast.split(', ')
  req.body.cast = castArray
  Movie.create(req.body, (err, newMovie) => {
    if(err) {console.log(err.message);}
    else { res.redirect('/movies')}
  })
})

//SHOW ROUTE
app.get('/movies/:id', (req, res) => {
  Movie.findById(req.params.id, (err, foundMovie) => {
    res.render('show.ejs', {
      movie: foundMovie,
      tabTitle: foundMovie.title + ' | Show Page' 
    })
  })
})


//SEARCH RESULTS ROUTE
app.post('/movies/search', (req, res) => {
  Movie.find({title: req.body.searchString}, (err, foundMovies) => {
    res.render('index.ejs', { 
      movies: foundMovies,
      tabTitle: 'Search results'
    })
  })
})

//SORT ROUTE -- TESTING


app.post('/movies/sort', (req, res) => {
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
      res.render('index.ejs', {
        tabTitle: 'Sorted By' + req.body.sortChoice,
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
      res.render('index.ejs', {
        tabTitle: 'Sorted By ' + req.body.sortChoice,
        movies: sortedMovies
      })
    })
  } else {
    Movie.find({}, null, {sort: req.body.sortChoice}, (err, sortedMovies) => {
      res.render('index.ejs', {
        tabTitle: 'Sorted By ' + req.body.sortChoice,
        movies: sortedMovies
      })
    })
  }
})

//EDIT ROUTE
app.get('/movies/:id/edit', (req, res) => {
  Movie.findById(req.params.id, (err, foundMovie) => {
    res.render('edit.ejs', {
      tabTitle: foundMovie.title + " | Edit Page",
      movie: foundMovie
    })
  })
})

//CONFIRM DELETE ROUTE
app.get('/movies/:id/confirm-delete', (req, res) => {
  Movie.findById(req.params.id, (err, foundMovie) => {
    res.render('confirmDelete.ejs', {
      tabTitle: 'Confirm delete?',
      movie: foundMovie
    })
  })
})

//DELETE ROUTE
app.delete('/movies/:id', (req, res) => {
  Movie.findByIdAndRemove(req.params.id, (err, foundMovie) => {
    res.redirect('/movies')
  })
})

//PUT ROUTE
app.put('/movies/:id', (req, res) => {
  req.body.cast = req.body.cast.split(', ')
  Movie.findByIdAndUpdate(req.params.id, req.body, (err, foundMovie) => {
    res.redirect('/movies')
  })
})

mongoose.connect(mongoURI, () => {
  console.log('The connection with mongod is established')
})

app.listen(PORT, () => {
  console.log('listening...')
})
