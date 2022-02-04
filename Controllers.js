const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User =  require('./models/User.js')

const landing = (req, res) => res.send(
    `<h1>Welcome to the moodies server</h1><br/>
    <p>Check out our neat API's:</p>
    <ul>
    <li >for movies @ <a href="https://get-moodies.herokuapp.com/movies" className="h">/movies</a> , and </li>
    <li >for users @ <a href="https://get-moodies.herokuapp.com/users"> /users </a></li>
    </ul>
  `)


// -------- User's controllers

const getAll = (req,res) => {
    User.find({})
    .then((result) => res.send(result))
    .catch((e) => res.send(e.message))
}
const addUser = async (req, res) => {
    const regex_email = /^([a-zA-Z0-9_!@#$%^&*()\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
    const existsUser = await User.findOne( { userName: req.body.userName }).select("userName");
    const existsEmail = await User.findOne( { email: req.body.email }).select("email");

    if(!req.body.userName || !req.body.magicword || !req.body.email )    {
        res.json({
            error:"Plase, fill out all fields"
        })
        return
    }
    
    if(!regex_email.test(req.body.email)){ 
        res.json({
            error:"Please, check and give us a valid email format"
        })
        return
    }

    if(existsUser){
        res.json({
            error:"Sorry! This user\'s name is not available"
        })
        return
    }

    if(existsEmail){
        res.json({
            error:'This email owns an account already'
        })
        return
    }
    
    bcrypt.hash(req.body.magicword,10)
    .then( (hashedPassword) => {
        User.create({
        userName: req.body.userName,
        magicword: hashedPassword,
        email: req.body.email,
        admin: req.body.admin
        })
        .then((result) => res.send(result)) 
    })
    .catch((e) => {
        res.status(500).send()
        console.log(e)
    })
}

const getOne = (req, res) => {
    req.user.userName === req.params.userName ?
        User.findOne( { userName: req.params.userName })
        .then((result) => res.send(result))
        .catch((e) => {
        console.log(e);
        res.send({ Error});
        }) 
        : res.json({status: "401", error:"Not Authorized"})
}

const edit = async (req, res) => {

    const existsUser = await User
        .findOne( { userName: req.body.userName })
        .select("userName")
        .catch((e)=>{console.log(e)})
    console.log(req.body)
    if(existsUser){
        res.json({
            error:"Sorry! This user\'s name is not available"
        })
        return
    }
    
    if(!req.body.userName )    {
        res.json({
            error:"Plase, fill out all fields"
        })
        return
    }
    
    User.findOne({ userName: req.params.userName })
            .then((user) => {
                console.log(user)
                user.userName = req.body.userName
                user.privateLists = req.body.privateLists
                //res.json(result)
                return user.save()
            })
            .then((updatedUser)=> res.json(updatedUser))
            .catch((e) =>  {
                console.log(e)
                res.status(500).send() 
            }) 
}

const delOne = (req, res) => {
    User.findOneAndDelete( { userName: req.params.userName })
        .then((result) => {
        res.send(`${req.params.userName}'s account deleted`)})
        .catch((e) => {
        console.log(e);
        res.send({ Error });
        });
}

const compare = async (req,res) => {    

    if(!req.body.userName || !req.body.magicword )    {
        res.json({
            error:"Plase, fill out all fields"
        })
        return
    }
    const {magicword} = await User.findOne( { userName: req.body.userName }).select("magicword");
    const matchedPassword = await bcrypt.compare(req.body.magicword, magicword )
    
    if(!matchedPassword) {
        res.status(403).send("Check your data!")
        return
    }

    const token = jwt.sign({ userName: req.body.userName}, process.env.JWT_SECRET);

    res.json({ success: true, token })
}

const getPublicProfile = (req, res) => {
    User.findOne( { userName: req.params.userName })
        .then((result) => res.send(result))
        .catch((e) => {
        console.log(e);
        res.send({ Error});
        })
    }

// -------- Middleware

const auhtenticateToken =  (req,res,next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if(token === null) return res.sendStatus(401).send('No token')
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    }
    )
};

const verifyReqVsParamUser = (req,res,next) => {

    req.user.userName === req.params.userName ? 
        next() 
        : res.json({status: "401", error:"Not Authorized"})
}
// -------- playlists Controllers

const Playlist =  require('./models/Playlist.js')

const getWatchlist = (req,res) => {
    req.user.userName === req.params.userName ?
        User.findOne( { userName: req.params.userName }).select('watchlist -_id')
        .then((result) => {
        res.send(`${req.params.userName}'s list: ${result}`)})
        .catch((e) => {
        console.log(e);
        res.send({ Error });
        })
        : res.json({status: "401", error:"Not Authorized"})
}

const editWatchlist =  (req, res) => {
    req.user.userName === req.params.userName ?
        User.findOne({ userName: req.params.userName })
            .then((user) => {
                user.watchlist = req.body.watchlist 
                return user.save()
            })
            .then((result) => {res.json(result)})
            : res.json({status: "401", error:"Not Authorized"})
    }

const getBlacklist = (req,res) => {
    req.user.userName === req.params.userName ?
        User.findOne( { userName: req.params.userName }).select('blacklist -_id')
        .then((result) => {
        res.send(`${req.params.userName}'s list: ${result}`)})
        .catch((e) => {
        console.log(e);
        res.send({ Error });
        })
        : res.json({status: "401", error:"Not Authorized"})
}

const editBlacklist = async (req, res) => {
    req.user.userName === req.params.userName ?
        User.findOne({ userName: req.params.userName })
            .then((user) => {
                user.blacklist = req.body.blacklist 
                return user.save()
            })
            .then((result) => {res.json(result)})
            : res.json({status: "401", error:"Not Authorized"})
    }

const getAllUserPlaylists = (req,res) => {
        req.user.userName === req.params.userName ?
            User.findOne( { userName: req.params.userName })
                .select('watchlist blacklist privateLists publicLists')
                .then((result) => {
                    res.json(result)})
                .catch((e) => {
                    console.log(e);
                    res.send({ Error });
                })
                : res.json({status: "401", error:"Not Authorized"})
    }



const addPlaylist = (req, res) => {
    Playlist.create( {
        name: req.body.name,
        public: req.body.public,
        movies: req.body.movies,
        tags: req.body.tags,
        editRight: req.params.userName
    })
    .then((result) => {
        User.findOne({ userName: result.editRight[0] })
            .select("+privateLists")
            .then((user) => {
                console.log( [...user.privateLists, result.name],result)
                user.privateLists = [...user.privateLists, result._id]
                return user.save()
            })
            .then((updatedUser) => {
                res.status(200).send(updatedUser);
            })
            .catch((e) =>  {
                            console.log(e)
                            res.status(500).send() 
            })
    })
    .catch((e) =>  {
        console.log(e)
        res.status(500).send() 
    })
        
        
    // const addedTo = result.editRight.map( (owner) => 
    //         User.findOne({ userName: owner })
    //         .then((user) => {
    //             user.privateLists = [...user.privateLists, result.name]
    //             return user.save()
    //         })
    //         .then((updatedUser)=> console.log(updatedUser))
    //         .catch((e) =>  {
    //             console.log(e)
    //             res.status(500).send() 
        //     }) 
        // ) 
    //     return addedTo
    // })
   // .then((result) => res.json(result)) 
}

const getOnePlaylist = (req, res) => {
    Playlist.findById( req.params.playlist_id )
        .then((result) => res.send(result))
        .catch((e) => console.log(e)) 
}

const editPlaylist = (req, res) => {
    Playlist.findById( req.params.playlist_id )
        .then( (list) => {
            const { name, public, movies, tags, editRight } = req.body
            
            list.name = name 
            list.public = public 
            list.movies = movies 
            list.tags =  tags
            list.editRight =  editRight

            return list.save()
        })
        .then((result) => res.json(result))
        .catch((e) => console.log(e))
}

const deletePlaylist = (req, res) => {
    Playlist.findByIdAndDelete(req.params.playlist_id )
        .then((result) => res.json({status: 200,result}))
        .catch((e) => console.log(e));
}





// -------- Movie Controllers

const Movie =  require('./models/Movie.js')

const getMovies = (req,res) => {
    Movie.find({})
    .then((result) => res.send(result))
    .catch((e) => res.send(e.message))
}

const addMovie = (req, res) => {
    Movie.create({
        movie_id: req.body.movie_id,
        data: req.body.movie,
        tags: req.body.tags,
        })
        .then((result) => res.send(result)) 
}

module.exports = {
    //Users
    getAll:getAll , 
    addUser:addUser, 
    getOne:getOne, 
    edit:edit, 
    delOne:delOne, 
    compare: compare,
    getPublicProfile:getPublicProfile,
    //Middleware
    verifyReqVsParamUser,
    auhtenticateToken:auhtenticateToken,
    landing,
    //Movies
    getMovies,
    addMovie,
    //Playlists
    getWatchlist,
    editWatchlist,
    getBlacklist,
    editBlacklist,
    getAllUserPlaylists,
    addPlaylist,
    deletePlaylist,
    editPlaylist,
    getOnePlaylist
}
