const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nominationSchema = new Schema({
  title: {type: String, required: true},
  forWhatScreening: {type: Date, required: true},
  submittedBy: {type: String, required: true},
  poster: {type: String},
  blurb: {type: String},
  winner: {type: Boolean}
}, {timestamps: true}
)

const Nomination = mongoose.model('Nomination', nominationSchema)
module.exports = Nomination
