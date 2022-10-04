const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nominationSchema = new Schema({
  title: {type: String, required: true},
  forWhatScreening: {type: Date},
  submittedBy: {type: String},
  poster: {type: String},
  blurb: {type: String},
}, {timestamps: true}
)

const Nomination = mongoose.model('Nomination', nominationSchema)
module.exports = Nomination
