const Movie = require('./movies')

let ffsActors = []
const populateActors = async () => {
    let allMovies = await Movie.find({})
    for (let movie of allMovies) {
        for(let actor of movie.cast) {
            if (!ffsActors.includes(actor)) {
                ffsActors.push(actor)
            }
        }
    }
    ffsActors = ffsActors.sort((a,b) => {
        //get first and last names
        let aNames = a.split(' ')
        let bNames = b.split(' ')
        let aLastName = aNames[aNames.length - 1]
        let bLastName = bNames[bNames.length - 1]
        let aFirstName = aNames[0]
        let bFirstName = bNames[0]
    
        //sort by last name, then first name if necessary
        if (aLastName === bLastName) {
            //If last names are the same, check first names
            if(aFirstName === bFirstName) {  
                //e.g. comparing "Michael Jordan" to "Michael B. Jordan"
                return 0
            } else if (aFirstName > bFirstName) {
                return 1
            } else {
                return -1
            }
        } else if (aLastName > bLastName) {
            return 1
        } else {
            return -1
        }
    })
}

populateActors()


module.exports = ffsActors