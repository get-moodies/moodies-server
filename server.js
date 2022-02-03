const express = require('express')
//const bodyParser = require('body-parser')
const cors = require('cors')
const server = express()
const mongoose = require('mongoose')
require('dotenv').config();

const PORT = 4000

//Controllers
const {
    getAll, 
    addUser, 
    getOne, 
    edit,
    delOne, 
    compare, 
    auhtenticateToken,
    getPublicProfile,
    getMovies,
    addMovie,
    getWatchlist,
    editWatchlist,
    getBlacklist,
    editBlacklist
    } = require('./controllers')

//Middleware: Cors & parse application/x-www-form-urlencoded & application/json
server.use(cors(), express.urlencoded({ extended: false }), express.json())

mongoose
    .connect(process.env.MONGODB_URL)
    .then((res)=> console.log("Connnected to Moodies DB"))
    .catch((error)=> console.log(error))

server.get("/", (req,res) =>  res.send(`<h1>Welcome to the moodies server</h1><br/>`));

server.route("/users")
    .get( getAll )
    .post( addUser)

server.route("/users/:userName")
    .get(auhtenticateToken,getOne)
    //.put(edit)
    .delete(delOne)

server.route("/users/:userName/watchlist")
    .get(auhtenticateToken,getWatchlist)
    .put(auhtenticateToken,editWatchlist)

server.route("/users/:userName/blacklist")
    .get(auhtenticateToken,getBlacklist)
    .put(auhtenticateToken,editBlacklist)

server.route("/profiles/:userName")
    .delete(getPublicProfile)


server.route("/login")
    .post( compare )

server.route("/profile/:userName")
.get(getPublicProfile)

server.route("/movies")
    .get( getMovies )
    .post( addMovie)


server.listen(PORT, () =>
    console.log(`Moodies server running at ${PORT}`)
);













