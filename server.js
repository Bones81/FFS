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

const Movie = require('./models/movies.js')
const Nomination = require('./models/nominations.js')
const Screening = require('./models/screening.js')
const req = require('express/lib/request')
const res = require('express/lib/response')
const { aggregate } = require('./models/movies.js')
const { application } = require('express')

//MIDDLEWARE
const moviesController = require('./controllers/movies.js')
const screeningsController = require('./controllers/screenings.js')
const nominationsController = require('./controllers/nominations.js')
app.use('/movies', moviesController)
app.use('/screenings', screeningsController)
app.use('/nominations', nominationsController)


//JSON routes

//HOME ROUTE
app.get('/', (req, res) => {
  res.redirect('/screenings')
})

//FIX DATES ROUTE
//I think this route was used to convert previously entered text dates to proper date format. Shouldn't be necessary any more... I think.
// app.get('/movies/fixdates', (req, res) => {
//   Movie.find({}, (err, allMovies) => {
//     if (err) {
//       console.log(err)
//     }
//     for (const movie of allMovies) {
//       //convert movie.dateScreened into date format and res.json into new seed data
//       // console.log(new Date(movie.dateScreened));
//       let newDateData = new Date(movie.dateScreened)
//       Movie.findOneAndUpdate({title: movie.title}, {$set: {dateScreened: newDateData}}, (err, updatedMovie) => {
//         console.log(updatedMovie);
//       } )
//       //then, if possible, PUT new date data into dateScreened property for each movie
//     }
//     res.json(allMovies)
//   })
// })





mongoose.connect(mongoLOC, () => {
  console.log('The connection with mongod is established')
})

app.listen(PORT, () => {
  console.log('listening on ' + PORT)
})
