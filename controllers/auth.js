const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const User = require('../models/users')

passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// DEFAULT ROUTE - render login page
router.get('/', (req, res) => {
    res.render('login.ejs', {
        tabTitle: 'FFS Login'
    }) 
})


// REGISTER ROUTE - render registration page
router.get('/register', (req, res) => {
    res.render('register.ejs', {
        tabTitle: 'FFS Register New User'
    }) 
})

// REGISTER USER ROUTE
// router.post('/register')

// LOGIN USER ROUTE
// router.post('/login')

// LOGIN FAILURE ROUTE
// router.get('/login-failure')

// LOGOUT USER ROUTE
// router.logout('/logout')

module.exports = router