//GOAL: To manufacture properly formatted dates for each screening date of the FFS, i.e every other Saturday from 4/11/2020 until the present

const screeningWeeks = []

//First FFS screening was on 4/11/2020
let startDate = new Date(2020, 3, 11, 20, 30) //gets the date object at Apr 11, 2020 at 8:30pm ET
console.log(startDate);

let currentDate = new Date()
console.log(currentDate)

//Loop through every 14 days and spit out the date object
let targetDate = startDate
screeningWeeks.push(targetDate) //push in the first date
while (targetDate <= currentDate) { //ensure that upcoming screening date is included
    let nextDateTime = targetDate.getTime() + 1000 * 60 * 60 * 24 * 14 //1000ms x 60s/min x 60min/hr x 24hrs/day x 14days
    targetDate = new Date(nextDateTime)
    screeningWeeks.push(targetDate) //push in date 14 days from previous date
}

screeningWeeks.reverse()

module.exports = screeningWeeks