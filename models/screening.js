const mongoose = require('mongoose')
const Schema = mongoose.Schema

const screeningSchema = new Schema({
  weekID: {type: Number, required: true},
  date: {type: Date, required: true},
  notes: {type: String},
  selection: {type: mongoose.Schema.Types.ObjectId, ref: "Movie"},
  nominations: [{type: mongoose.Schema.Types.ObjectId, ref: "Nomination"}]
}, {timestamps: true}
)

const Screening = mongoose.model('Screening', screeningSchema)
module.exports = Screening
