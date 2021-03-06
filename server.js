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
    } = require('./Controllers.js')

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
    editPlaylist,
    getListComplete,
    getAllListsComplete,
    getPublicListComplete,
    getPublicLists,
    getTags,
    getListsMoviesFull,
    getPrivateListComplete,
    getPublicMoviesFull
} = require('./Controllers.js')

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
    .put(auhtenticateToken,verifyReqVsParamUser, edit)
    .delete(auhtenticateToken,verifyReqVsParamUser,delOne)


// -------- Playlist Routes

server.route("/users/:userName/watchlist")
    .get(auhtenticateToken,getWatchlist)
    .put(auhtenticateToken,editWatchlist)

server.route("/users/:userName/blacklist")
    .get(auhtenticateToken,getBlacklist)
    .put(auhtenticateToken,editBlacklist)

server.route("/users/:userName/playlists")
    .get(auhtenticateToken, getAllListsComplete)
    .post(auhtenticateToken, verifyReqVsParamUser, addPlaylist)


    // getAllUserPlaylists
// server.route("/users/:userName/playlists/:playlist_id")
//     .get(auhtenticateToken, verifyReqVsParamUser, getOnePlaylist)


server.route("/users/:userName/playlists/:playlist_id")
    .get( getListComplete )
    .put(auhtenticateToken, verifyReqVsParamUser, editPlaylist)
    .delete(auhtenticateToken, verifyReqVsParamUser, deletePlaylist)

server.route("/profiles/:userName/playlists")
    .get(getPublicListComplete )
    .put(auhtenticateToken, verifyReqVsParamUser, editPlaylist)
    //.delete(auhtenticateToken, verifyReqVsParamUser, deletePlaylist)

server.route("/playlists/getpublic")
    .get( getPublicLists )

server.route("/playlists/bytag/:tag")
    .get( getTags )       

server.route("/playlists/getLists")
    .get( getListsMoviesFull )

server.route("/users/:userName/privateComplete")
    .get( getPrivateListComplete )

server.route("/users/:userName/publicComplete")
    .get( getPublicMoviesFull )


    
server.listen(PORT, () =>
    console.log(`Moodies server running at ${PORT}`)
);
