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
const req = require('express/lib/request')
const res = require('express/lib/response')
const { aggregate } = require('./models/movies.js')
const { application } = require('express')
  
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

//DROP COLLECTION
// Movie.collection.drop()

//JSON routes
app.get('/movies/json', (req, res) => {
  Movie.find({}, (err, movies) => {
    res.json(movies)
  })
})

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

app.get('/nominations', (req, res) => {
  Nomination.find({}, (err, nominations) => {
    res.render('nominations.ejs', {
      tabTitle: 'FFS Nominations',
      nominations: nominations
    })
  })
})

//"ADD NEW" ROUTES
app.get('/movies/new', (req, res) => {
  res.render('new.ejs', {
    tabTitle: 'Add Movie'
  })
})

app.get('/nominations/new', (req, res) => {
  res.render('new_nomination.ejs', {
    tabTitle: 'Add Nomination'
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

//FOR NOMINATED FILMS
app.post('/nominations', (req, res) => {
  let date = new Date(req.body.forWhatScreening)
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
  req.body.forWhatScreening = formattedDate

  Nomination.create(req.body, (err, newNomination) => {
    if(err) {console.log(err.message);}
    else { res.redirect('/nominations')}
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


//SHOW ROUTE
app.get('/movies/:id', (req, res) => {
  Movie.findById(req.params.id, (err, foundMovie) => {
    res.render('show.ejs', {
      movie: foundMovie,
      tabTitle: foundMovie.title + ' | Show Page' 
    })
  })
})

app.get('/nominations/:id', (req, res) => {
  Nomination.findById(req.params.id, (err, foundNomination) => {
    res.render('show_nomination.ejs', {
      nomination: foundNomination,
      tabTitle: foundNomination.title + ' | Nomination' 
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

//SORT ROUTE
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
      res.render('index.ejs', {
        tabTitle: 'Sorted By ' + req.body.sortChoice,
        movies: sortedMovies
      })
    })
  } else if (req.body.sortChoice === 'most_recent') { 
    Movie.find({}, (err, allMovies) => {
      if(err) console.log(err.message);
      const sortedMovies = allMovies.sort((a,b) => {
        if (a.dateScreened < b.dateScreened) {
          return 1
        } else if (a.dateScreened > b.dateScreened) {
          return -1 
        } else {
          return 0
        }
      })
      res.render('index.ejs', {
        tabTitle: 'Sorted By ' + req.body.sortChoice,
        movies: sortedMovies
      })
    })
  } else if (req.body.sortChoice === 'screening_order') { 
    Movie.find({}, (err, allMovies) => {
      if(err) console.log(err.message);
      const sortedMovies = allMovies.sort((a,b) => {
        if (a.dateScreened > b.dateScreened) {
          return 1
        } else if (a.dateScreened < b.dateScreened) {
          return -1 
        } else {
          return 0
        }
      })
      res.render('index.ejs', {
        tabTitle: 'Sorted By ' + req.body.sortChoice,
        movies: sortedMovies
      })
    })
  }else {
    Movie.find({}, null, {sort: req.body.sortChoice}, (err, sortedMovies) => {
      res.render('index.ejs', {
        tabTitle: 'Sorted By ' + req.body.sortChoice,
        movies: sortedMovies
      })
    })
  }
})

//EDIT ROUTES
app.get('/movies/:id/edit', (req, res) => {
  Movie.findById(req.params.id, (err, foundMovie) => {
    res.render('edit.ejs', {
      tabTitle: foundMovie.title + " | Edit Page",
      movie: foundMovie
    })
  })
})

app.get('/nominations/:id/edit', (req, res) => {
  Nomination.findById(req.params.id, (err, foundNom) => {
    res.render('edit_nomination.ejs', {
      tabTitle: foundNom.title + " | Edit Nomination",
      nomination: foundNom
    })
  })
})

//CONFIRM DELETE ROUTES
app.get('/movies/:id/confirm-delete', (req, res) => {
  Movie.findById(req.params.id, (err, foundMovie) => {
    res.render('confirmDelete.ejs', {
      tabTitle: 'Confirm delete?',
      movie: foundMovie
    })
  })
})

app.get('/nominations/:id/confirm-delete', (req, res) => {
  Nomination.findById(req.params.id, (err, foundNom) => {
    res.render('confirm_nomination_delete.ejs', {
      tabTitle: 'Confirm delete?',
      nomination: foundNom
    })
  })
})

//DELETE ROUTES
app.delete('/movies/:id', (req, res) => {
  Movie.findByIdAndRemove(req.params.id, (err, foundMovie) => {
    res.redirect('/movies')
  })
})

app.delete('/nominations/:id', (req, res) => {
  Nomination.findByIdAndRemove(req.params.id, (err, foundNomination) => {
    res.redirect('/nominations')
  })
})

//PUT ROUTES
app.put('/movies/:id', (req, res) => {
  req.body.cast = req.body.cast.split(', ')
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
  Movie.findByIdAndUpdate(req.params.id, req.body, (err, foundMovie) => {
    res.redirect('/movies')
  })
})

app.put('/nominations/:id', (req, res) => {
  let date = new Date(req.body.forWhatScreening)
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
  req.body.forWhatScreening = formattedDate
  console.log(req.body.winner)
  let checked = req.body.winner === "on" ? true : false
  req.body.winner = checked
  Nomination.findByIdAndUpdate(req.params.id, req.body, (err, foundNomination) => {
    res.redirect('/nominations')
  })
})


mongoose.connect(mongoURI, () => {
  console.log('The connection with mongod is established')
})

app.listen(PORT, () => {
  console.log('listening on ' + PORT)
})
