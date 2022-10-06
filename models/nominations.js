const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nominationSchema = new Schema({
  screening: {type: mongoose.Schema.Types.ObjectId, ref: "Screening", required: true},
  nominator: {type: String, required: true},
  blurb: {type: String},
  nominee: {type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true}
}, {timestamps: true}
)

const Nomination = mongoose.model('Nomination', nominationSchema)
module.exports = Nomination
