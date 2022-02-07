const mongoose = require('mongoose')
const {Schema} = mongoose

const User = new Schema({
    
    userName: {
        type: String,
        lowercase: true, 
        required: [true, 'Please, choose a user\'s name'],
        unique:[true, 'Sorry! This user\'s name is not available']},
    
    email: {
        type: String, 
        required:[true, 'Please, add a (valid) email'],
        unique:[true, 'This email owns an account already'],
        match:[/^([a-zA-Z0-9_!@#$%^&*()\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/,
                'Please, check and give us a valid email format'],
        select: false                    
    },
    
    magicword: {
        type: String, 
        required: [true, 'Please, provide an email'],
        select: false
    },
    
    modified: { 
        type: Date,
        default: Date.now},

    admin: { 
        type: Boolean,
        default: false,
        select: false
    },
    watchlist: {
        type: [{type: String}], 
        select: false},
    blacklist: {
        type: [{type: String}], 
        select: false},
    privateLists: {
        type: [{type: String}], 
        select: false},
    publicLists: [{type: String}],
    info: {type: String}
})

module.exports = mongoose.model('User',User)