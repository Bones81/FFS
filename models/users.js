const express = require('express')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({
    username: {type: String, required: true, unique: true},
    role: {type: String, default: 'visitor', required: true}
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)