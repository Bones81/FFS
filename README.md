# FFS

Welcome to the Fortnightly Film Society Web App!

## Live Link

To view and use The FFS Web App, visit [https://ffs.fly.dev](https://ffs.fly.dev)

### Technical Features

- Built with Express.js, Node.js, Mongo DB (via Mongo Atlas cloud storage), EJS templating language, Passport.js, Mongoose, vanilla CSS and additional vanilla JavaScript front-end scripting

- App features a responsive design utilizing Flexbox, Grid, and media queries.

- Full npm package list:
1. connect-flash: ^0.1.1, (Unutilized a/o 4/22/23)
1. connect-mongo: ^5.0.0,
1. dotenv: ^16.0.1,
1. ejs: ^3.1.6,
1. express: ^4.17.2,
1. express-session: ^1.17.3,
1. method-override: ^3.0.0,
1. mongoose: ^6.10.0,
1. passport: ^0.6.0,
1. passport-local: ^1.0.0,
1. passport-local-mongoose: ^8.0.0


### App History

- The FFS Web App was begun in Feb 2022 as an assignment in General Assembly's Software Engineering Immersive Remote course. It was an exercise designed to help learn the basics of building a full stack web application with MVC (Model-View-Controller) principles. Express, Node, and MongoDB comprise the back-end while EJS views get served to the front-end.

- Initially, there was only a single model for movies, and the only movies included in the database were movies screened by the FFS. 

- After completing the General Assembly program, additional features and functionality were added including multiple models, multiple many-to-one relationships, sorts and filters, and most recently user authentication and authorization through Passport.js. 

### App Features

- The FFS Web App enables all visitors to view information for all Fortnightly Film Society screenings and nominations. In addition, it hosts a sortable and filterable database of all movies that have been explicitly considered by the Society, even those that have not been nominated.

- FFS members have the additional ability to add films to the database and to add nominations for upcoming screenings. They can also edit existing movie information or nomination information. They can also delete movies or nominations should the need arise. 

- FFS admins have all the above abilities plus the ability to add, edit, or delete screening information.

### Potential Future Features

- FFS members currently participate in a nomination and voting process to select winning movies for each screening. They use a ranked choice alorithm to calculate the winner based on member votes. It would be great to employ the FFS app to manage this entire process: 
  - opening a nomination window
  - collecting nominations from members
  - closing the nomination window
  - beginning a voting window
  - collecting votes from members, limited to one ballot per member
  - closing the voting window
  - performing a ranked choice algorithm to determine the winning movie
  - announcing the result to membership
 
- Given the increasing amount of data with each additional movie added to the database, it would be interesting to include some data visualizations. Perhaps a visitor could see what genre of movie has been screened most often, etc. in bar or pie graph format. And eventually, perhaps users could select the data points they would like to see plotted in the graph. This would likely require incorporating a JS data visualization library such as Chart.js or D3.js

- Could potentially be converted into a React front-end

- Currently movie poster URLs must be manually copy/pasted into the form that adds new films to the database. It would be nice to enable users to simply copy the image and paste it directly into the form, as that is more user-friendly and common behavior.

- Even more convenient would be to connect all movie info from a 3rd-party API. This would also likely result in more complete data; however, the FFS has often considered many obscure or little-documented films that may not be represented in a common 3rd-party API. Perhaps the app can include both manual information input and a 3rd-party API information access option. 

- An excellent addition would be unit testing. When the FFS app was first conceived, this developer knew very little about proper testing or the potential of testing suites like Mocha, etc. Honestly, it might be a large undertaking at this point, as the app has become rather robust for one developer to handle. But the app remains vulnerable to mistakes and bugs without testing, and additional development will likely take longer as a result until unit testing can be added.

### Known Issues

- Some of the data management routes, particularly updates, do not always handle the updating of related models correctly. For instance, while filtering movies that were "originally nominated by" a given FFS member, movies may pass the filter that were actually originally nominated by a different FFS member. This is occurring because when determining original nominators for a movie, the update function does not seem to always catch which nomination was earliest. 

- Since all data has thus far (a/o 4/22/23) been manually added, there is likely some incorrect or irregular data that has slipped through. 

- As this is still an early-career project, no tests or testing suite has been used thus far, making this app very susceptible to potential bugs and mistakes. 

