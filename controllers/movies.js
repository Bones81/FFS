const express = require('express')
const router = express.Router()

const Movie = require('../models/movies')
const movieSeed = require('../models/seed_movies')


module.exports = router