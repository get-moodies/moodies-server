const express = require('express')
const cors = require('cors')
const server = express()
const mongoose = require('mongoose')
require('dotenv').config();

const PORT = process.env.PORT || 4000;

//Controllers
const {
    //users
    getAll, 
    addUser, 
    getOne, 
    edit,
    delOne, 
    compare,
    getPublicProfile,

    //middleware 
    verifyReqVsParamUser,
    auhtenticateToken,
    landing,

    //movies
    getMovies,
    addMovie
    } = require('./controllers.js')

const {
    //playlist
    getWatchlist,
    editWatchlist,
    getBlacklist,
    editBlacklist,
    getAllUserPlaylists,
    addPlaylist,
    getOnePlaylist,
    deletePlaylist,
    editPlaylist
} = require('./controllers.js')

//Middleware: Cors & parse application/x-www-form-urlencoded & application/json
server.use(cors(), express.urlencoded({ extended: false }), express.json())


mongoose
    .connect(process.env.MONGODB_URL)
    .then((res)=> console.log("Connnected to Moodies DB"))
    .catch((error)=> console.log(error))

server.get("/", landing );

// -------- Movie Routes

server.route("/movies")
    .get( getMovies )
    .post( addMovie)

// -------- User routes

server.route("/users")
    .get( getAll )
    .post( addUser)

server.route("/login")
    .post( compare )

server.route("/profile/:userName")
    .get(getPublicProfile)

server.route("/users/:userName")
    .get(auhtenticateToken,getOne)
    .put(edit)
    .delete(auhtenticateToken,delOne)


// -------- Playlist Routes

server.route("/users/:userName/watchlist")
    .get(auhtenticateToken,getWatchlist)
    .put(auhtenticateToken,editWatchlist)

server.route("/users/:userName/blacklist")
    .get(auhtenticateToken,getBlacklist)
    .put(auhtenticateToken,editBlacklist)

server.route("/users/:userName/playlists")
    .get(auhtenticateToken, getAllUserPlaylists)
    .post(auhtenticateToken, verifyReqVsParamUser, addPlaylist)

server.route("/users/:userName/playlists/:playlist_id")
    .get(auhtenticateToken, verifyReqVsParamUser, getOnePlaylist)
    .put(auhtenticateToken, verifyReqVsParamUser, editPlaylist)
    .delete(auhtenticateToken, verifyReqVsParamUser, deletePlaylist)

    server.listen(PORT, () =>
    console.log(`Moodies server running at ${PORT}`)
);
