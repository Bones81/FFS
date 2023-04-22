const express = require('express')
const app = express()
const passport = require('passport')
const session = require('express-session')
const mongoose = require('mongoose')
const db = mongoose.connection
const MongoStore = require('connect-mongo')
require('dotenv').config()

const methodOverride = require('method-override')

const mongoURI = process.env.MONGODB_URI
const mongoLOC = 'mongodb://localhost:27017/'+'FFS'
const PORT = process.env.PORT || 3003

mongoose.connect(mongoURI, () => {
  console.log('The connection with mongod is established')
})

const Movie = require('./models/movies.js')
const Nomination = require('./models/nominations.js')
const Screening = require('./models/screening.js')
const req = require('express/lib/request')
const res = require('express/lib/response')
const { aggregate } = require('./models/movies.js')
const { application } = require('express')

//MIDDLEWARE
const maintenanceMiddleware = (req, res, next) => {
  const isMaintenance = false
  if(isMaintenance) {
    res.render('maintenance.ejs', {
      tabTitle: 'FFS Maintenance In Progress'
    })
  } else {
    next()
  }
}

app.use(maintenanceMiddleware) // renders maintenance ahead of all other routes

app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(methodOverride('_method')) // enables use of _method attribute
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 },
  store: MongoStore.create({ mongoUrl: mongoURI })
}))


app.use(passport.initialize())
app.use(passport.session())

const moviesController = require('./controllers/movies.js')
const screeningsController = require('./controllers/screenings.js')
const nominationsController = require('./controllers/nominations.js')
const authController = require('./controllers/auth.js')
app.use('/movies', moviesController)
app.use('/screenings', screeningsController)
app.use('/nominations', nominationsController)
app.use('/', authController)


// app.get('/', (req, res) => {
//   if(maintenance) {
//     res.render('maintenance.ejs', {
//       tabTitle: 'FFS Maintenance Mode'
//     })
//   } else {
//     res.redirect('/auth')
//   }
// })

app.get('/staff', (req, res) => {
  res.render('staff.ejs', {
    user: req.user,
    sessionID: req.sessionID,
    tabTitle: 'FFS Staff'
  }) 
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})


app.listen(PORT, () => {
  console.log('listening on ' + PORT)
})
