const mongoose = require('mongoose')
const Schema = mongoose.Schema

const movieSchema = new Schema({
  title: {type: String, required: true},
  dateScreened: {type: Date},
  year: {type: String},
  director: {type: String},
  cast: [String],
  poster: {type: String}
}, {timestamps: true}
)

const Movie = mongoose.model('Movie', movieSchema)
module.exports = Movie
