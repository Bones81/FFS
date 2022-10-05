const mongoose = require('mongoose')
const Schema = mongoose.Schema

const screeningSchema = new Schema({
  weekID: {type: Number, required: true},
  date: {type: Date, required: true},
  notes: {type: String}
  //selection: Movie -- will be of format movieSchema
  //nominations: [Nominations] -- will be an array of objects in the format of nominationSchema
}, {timestamps: true}
)

const Screening = mongoose.model('Screening', screeningSchema)
module.exports = Screening
