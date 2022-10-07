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
const mongoLOC = 'mongodb://localhost:27017/'+'FFS'
const PORT = process.env.PORT || 3003

const seedMovies = require('./models/seed_movies.js')
const Movie = require('./models/movies.js')
const Nomination = require('./models/nominations.js')
const Screening = require('./models/screening.js')
const req = require('express/lib/request')
const res = require('express/lib/response')
const { aggregate } = require('./models/movies.js')
const { application } = require('express')

//MIDDLEWARE
const moviesController = require('./controllers/movies.js')
app.use('/movies', moviesController)
const screeningsController = require('./controllers/screenings.js')
app.use('/screenings', screeningsController)
const nominationsController = require('./controllers/nominations.js')
app.use('/nominations', nominationsController)

//SEED INITIAL MOVIE DATA
app.get('/movies/seed', (req, res) => {
  // console.log(seedMovies)
  Movie.create(seedMovies, (err, data) => {
    console.log(data)
    if (err) console.log(err)
    console.log('added provided movie data')  
    res.redirect('/movies')
  })
})

//DROP COLLECTION -- BE VERY CAREFUL ABOUT UNCOMMENTING THIS WHILE SERVER IS RUNNING!
// Movie.collection.drop()

//JSON routes


app.get('/nominations/json', (req, res) => {
  Nomination.find({}, (err, nominations) => {
    res.json(nominations)
  })
})

//HOME ROUTE
app.get('/', (req, res) => {
  res.redirect('/movies')
})

//INDEX ROUTES
app.get('/movies', (req, res) => {
  Movie.find({}, (err, allMovies) => {
    const sortedMovies = allMovies.sort((a,b) => {
      if (a.dateScreened > b.dateScreened) {
        return 1
      } else if (a.dateScreened < b.dateScreened) {
        return -1
      } else {
        return 0
      }
    })

  //  res.json(allMovies);
    res.render('index.ejs', {
      tabTitle: 'The Fortnightly Film Society Website',
      movies: sortedMovies
    })
  })
})



//CREATE ROUTES
//FOR SELECTED FILMS
app.post('/movies', (req, res) => {
  let castArray = req.body.cast.split(', ')
  req.body.cast = castArray
  let date = new Date(req.body.dateScreened)
  console.log('original date: ' + date.toString())
  formattedDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  )
  console.log('Date with UTC params: ' + formattedDate.toString());
  req.body.dateScreened = formattedDate
  Movie.create(req.body, (err, newMovie) => {
    if(err) {console.log(err.message);}
    else { res.redirect('/movies')}
  })
})


//FIX DATES ROUTE
//I think this route was used to convert previously entered text dates to proper date format. Shouldn't be necessary any more... I think.
app.get('/movies/fixdates', (req, res) => {
  Movie.find({}, (err, allMovies) => {
    if (err) {
      console.log(err)
    }
    for (const movie of allMovies) {
      //convert movie.dateScreened into date format and res.json into new seed data
      // console.log(new Date(movie.dateScreened));
      let newDateData = new Date(movie.dateScreened)
      Movie.findOneAndUpdate({title: movie.title}, {$set: {dateScreened: newDateData}}, (err, updatedMovie) => {
        console.log(updatedMovie);
      } )
      //then, if possible, PUT new date data into dateScreened property for each movie
    }
    res.json(allMovies)
  })
})





mongoose.connect(mongoLOC, () => {
  console.log('The connection with mongod is established')
})

app.listen(PORT, () => {
  console.log('listening on ' + PORT)
})
