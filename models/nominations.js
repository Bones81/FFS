const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nominationSchema = new Schema({
  title: {type: String, required: true},
  screeningWeek: {type: Number},
  submittedBy: {type: String},
  posterURL: {type: String},
  blurb: {type: String},
}, {timestamps: true}
)

const Nomination = mongoose.model('Nomination', nominationSchema)
module.exports = Nomination
