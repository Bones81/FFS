const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const User = require('../models/users')

passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// INDEX ROUTE - redirect to screenings index page
router.get('/', (req, res) => {
    res.redirect('/screenings') 
})


// REGISTER ROUTE - render registration page
router.get('/register', (req, res) => {
    const user = req.user || null
    const sessionID = req.sessionID || "No SessionID found"
    res.render('register.ejs', {
        tabTitle: 'FFS Register New User',
        user: user,
        sessionID: sessionID,
        errorMessage: null
    }) 
})

// LOGIN PAGE - render login page
router.get('/login', (req, res) => {
    const user = req.user || null
    const sessionID = req.sessionID || "No SessionID found"
    res.render('login.ejs', {
        tabTitle: 'FFS Login Existing User',
        user: user,
        sessionID: sessionID,
    }) 
})

// REGISTER USER ROUTE
router.post('/register', (req, res) => {
    let role = 'visitor'
    if(req.body.memberPW === process.env.MEMBER_SECRET) {
        // update role to be 'member'
        role = 'member'
    }
    User.register(
        new User({
            username: req.body.username,
            role: role
        }), req.body.password, (err, msg) => {
            if(err) {
                console.log(err.message);
                res.render('register.ejs', {
                    tabTitle: 'An error occurred.',
                    user: null,
                    sessionID: null,
                    errorMessage: err.message
                })
            } else {
                console.log('Registration successful');
                res.redirect('/login')
            }
        }
    ) 
})

// LOGIN USER ROUTE
router.post('/login', 
    passport.authenticate('local', {
        failureRedirect: '/login-failure',
        successRedirect: '/screenings',
    }), (err, req, res, next) => {
        console.log(req.user);
        if(err) return next(err)
    }
)

// LOGIN FAILURE ROUTE
router.get('/login-failure', (req, res, next) => {
    console.log(req.session);
    res.render('login-failure.ejs', {
        user: req.user,
        sessionID: req.sessionID,
        tabTitle: 'Login Failed',
    }) 
})

// LOGOUT USER ROUTE
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if(err) {
            console.log(err.message);
            return next(err)
        }
    })
    res.redirect('/') 
})

module.exports = router