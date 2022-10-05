const mongoose = require('mongoose')
const Schema = mongoose.Schema

const screeningSchema = new Schema({
  weekID: {type: Number, required: true},
  date: {type: Date, required: true},
  notes: {type: String},
  selection: {type: String},
  nominees: [String]
}, {timestamps: true}
)

const Screening = mongoose.model('Screening', screeningSchema)
module.exports = Screening
