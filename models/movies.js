const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema(
  {
    title: { type: String, required: true }, //name of movie
    year: Number, //year of movie's release
    director: String,
    cast: [String],
    poster: String, //url string
    origNominator: String,
    allNominators: [String],
    nominations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Nomination" }],
    screened: Boolean,
    genre: [String],
    screening: { type: mongoose.Schema.Types.ObjectId, ref: "Screening" },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
