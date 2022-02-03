const mongoose = require('mongoose')
const {Schema} = mongoose

const Movie = new Schema({
    movie_id: {
        type: String,
        required: [true, 'invalid id'],
        unique:[true, 'movie id already here']},
    
    data: {
        type: Object, 
        required:[true, 'Error, sending movie data'],
    },

    tags: [{type: String}],
    
    modified: { 
        type: Date,
        default: Date.now}

})

module.exports = mongoose.model('Movie',Movie)