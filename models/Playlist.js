const mongoose = require('mongoose')
const {Schema} = mongoose

const Playlist = new Schema({

    name: {
        type: String,
        required: [true, 'Please, name the list'],
    },
    
    modified: { 
        type: Date,
        default: Date.now
    },

    public: { 
        type: Boolean,
        default: true
    },

    movies: {
        type: [{type: String}], 
    },

    tags: {
        type: [{type: String}], 
    },

    editRight: {
        type: [{type: String}], 
    }
})

module.exports = mongoose.model('Playlist',Playlist)