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
    .then((result) => res.status(200).json(result))
    .catch((e) => res.status(500).send(e.message))
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
        .then((result) => res.status(201).json(result)) 
    })
    .catch((e) => {
        res.status(400).json()
        console.log(e)
    })
}

const getOne = (req, res) => {
    req.user.userName === req.params.userName ?
        User.findOne( { userName: req.params.userName })
        .select('userName email watchlist blacklist privateLists publicLists info image')
        .then((result) => res.status(200).json({result:result,status:200}))
        .catch((e) => {
        console.log(e);
        res.send("error");
        }) 
        : res.status(401).json({status: "401", error:"Not Authorized"})
}

const edit = async (req, res) => {
    
    if(!req.body.info )    {
        res.status(400).json({
            error:"Plase, fill out all fields"
        })
        return
    }

    User.findOne({ userName: req.params.userName })
            .then((user) => {
                user.info = req.body.info
                user.image = req.body.image
                return user.save()
            })
            .then((updatedUser)=> res.status(201).json(updatedUser))
            .catch((e) =>  {
                console.log(e)
                res.status(500).json({
                    error:"Error"
                }) 
            }) 
}

const delOne = (req, res) => {
    User.findOneAndDelete( { userName: req.params.userName })
        .then((result) => {
        res.status(200).json(result)})
        .catch((e) => {
        console.log(e);
        res.status(500).json({error: "Error"}) 
        });
}

const compare = async (req,res) => {    

    if(!req.body.userName || !req.body.magicword )    {
        res.status(400).json({
            status:400,
            error:"Plase, fill out all fields"
        })
        return
    }
    const {magicword} = await User.findOne( { userName: req.body.userName }).select("magicword");
    const matchedPassword = await bcrypt.compare(req.body.magicword, magicword )
    
    if(!matchedPassword) {
        res.status(403).json({status:403,error: "Check your data!"})
        return
    }

    const token = jwt.sign({ userName: req.body.userName}, process.env.JWT_SECRET);

    res.status(200).json({ status:200,success: true, token })
}

const getPublicProfile = (req, res) => {
    User.findOne( { userName: req.params.userName })
        .then((result) => res.status(200).json(result))
        .catch((e) => {
        console.log(e);
        res.status(500).json("error: Error") 
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
        User.findOne( { userName: req.params.userName })
        .select('watchlist')
        .then((result) => res.json(result))
        .catch((e) => {
        console.log(e);
        res.send({ Error });
        })
        : res.json({status: "401", error:"Not Authorized"})
}

const editWatchlist = (req, res) => {
    req.user.userName === req.params.userName ?
        User.findOne({ userName: req.params.userName }).select('watchlist')
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
                    res.json({status: "401", result:result})})
                .catch((e) => {
                    console.log(e);
                    res.send({ Error });
                })
                : res.json({status: "401", error:"Not Authorized"})
    }


const addPlaylist = (req, res) => {
    
// const updateList = (public, user,result) => {
//     if (public) {     
//         console.log( "adding to public lists",[...user.publicLists, result._id])
//         return [...user.publicLists, result._id]
            
//     }

//     console.log( "adding to private lists")
//     user.privateLists = [...user.privateLists, result._id]
//     return
// } 

    Playlist.create( {
        name: req.body.name,
        public: req.body.public,
        movies: req.body.movies,
        tags: req.body.tags,
        editRight: req.body.editRight
    })
    .then((result) => {
        console.log("user:",result, result.name, result.public, result.editRight)
        User.findOne({ userName: result.editRight[0] })
            .select("privateLists publicLists")
            .then((user) => {
                if (req.body.public) {     
                    console.log( "adding to public lists",[...user.publicLists, result._id])
                     user.publicLists = [...user.publicLists, result._id]     
                }
                else { user.privateLists = [...user.privateLists, result._id]
                    console.log( "adding to public lists",[...user.publicLists, result._id])}
                return user.save()
            })
            .then((updatedUser) => {
                res.status(200).json({status:200, result:{addedList: result, updatedUser: updatedUser}});
               // console.log("upadted user", updatedUser)
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
}

const getOnePlaylist = (req, res) => {
    Playlist.findById( req.params.playlist_id )
        .then((result) => res.send(result))
        .catch((e) => console.log(e)) 
}

const editPlaylist = (req, res) => {

let publicState = false

const updateList = (public, user,result) => {
    if (public) {     
        console.log( "changing to public lists",[...user.publicLists, result._id])
        user.publicLists = [...user.publicLists, result._id]
        user.privateLists = user.privateLists
            .filter((list)=> list != result._id)
        return    
    }

    console.log( "changing to private lists")
    user.privateLists = [...user.privateLists, result._id]
    user.publicLists = user.publicLists
        .filter((list)=> list != result._id)
    return    
} 

    Playlist.findById( req.params.playlist_id )
        .then( (list) => {
            publicState = list.public
            const { name, public, movies, tags, editRight } = req.body
            list.name = name 
            list.public = public 
            list.movies = movies 
            list.tags =  tags
            list.editRight =  editRight

            return list.save()
        })
        .then((result) => {
            console.log(publicState !== req.body.public)
            if ((publicState !== req.body.public) && !result.editRight[1] ){
                User.findOne({ userName: result.editRight[0] })
                    .select("+privateLists")
                    .then((user) => {
                        updateList(req.body.public,user,result)
                        return user.save()
                    })
                    .then((updatedUser) => {
                        res.status(200).json({status:200, result:{edditedList: result, updatedUser: updatedUser}});
                    })
                    .catch((e) =>  {
                                    console.log(e)
                                    res.status(500).send() 
                    })
            }
            // if ((publicState !== req.body.public) && list.editRight[1] ){res.status(500).json({error:"Can not change Public status of a collective List"}) }
            else {res.status(200).json({status:200, result:result})}
        })
        .catch((e) =>  {
            console.log(e)
            res.status(500).send() 
        })
}

const deletePlaylist = async (req, res) => {

    // let id = ''
    // let public = false
    // let owner = ''

    // Playlist.findByIdAndDelete( req.params.playlist_id )
    //     .then((result) => { 
    //         id = result._id
    //         public = result.body.public
    //         owner = result.editRight[0]
    //         res.json({status: 200,result:result})})
    //     .catch((e) => console.log(e))
    // findByIdAndDelete( req.params.playlist_id )
    const result = await Playlist.findById( req.params.playlist_id )
  
    let id = result._id
    let public = result.public
    let owner = result.editRight[0]
        
    console.log( id, public, owner, result)

    const user = await User.findOne({ userName: owner }).select("privateLists publicLists")
        
    if (public) {     
        // console.log( "deleting from public lists",user.publicLists.filter( (list) => list != id),
        // user.publicLists.filter( (list) => !(list === id)))
        user.publicLists = user.publicLists.filter( (list) => {return list != id})
        console.log("user inside if:", user)
    } else { 
        user.privateLists = user.privateLists.filter( (list) => {return list != id})
    }
    console.log("user outside if:", user)
    res.json(user)
    // await user.save();
            
            // const publicPlaylists = info.publicLists
            // const newPublicPlaylists = await Playlist.find({ '_id': { $in: publicPlaylists } });
            // res.json({...info._doc,["public"]: newPublicPlaylists})
         



        // .then((result) => 
        // User.findOne({ userName: result.editRight[0] }))
        //     .select("privateLists publicLists")
        //     .then((user) => {
        //         // console.log("result:",result)
        //         if (result.body.public) {     
        //             // console.log( "deleting from public lists",user.publicLists.filter( (list) => list != result._id))
        //              user.publicLists = user.publicLists.filter( (list) => {list !== result._id})
        //         }
        //         else { user.privateLists = user.privateLists.filter( (list) => {list !== result._id})
        // // console.log( "deleting from private lists",user.privateLists.filter( (list) => list != result._id))
        //             }
        //         return user.save()   
        //     })
           
}






// -------- Movie Controllers

const Movie =  require('./models/Movie.js')
const { json } = require('express')

const getMovies = (req,res) => {
    Movie.find({})
    .then((result) => res.json({status:200,result:result}))
    .catch((e) => res.send(e.message))
}

// const getOneMovie = (req, res) => {
//     req.user.userName === req.params.userName ?
//         User.findOne( { userName: req.params.userName })
//         .select('userName email watchlist blacklist privateLists publicLists')
//         .then((result) => res.status(200).json({result:result,status:200}))
//         .catch((e) => {
//         console.log(e);
//         res.send("error");
//         }) 
//         : res.status(401).json({status: "401", error:"Not Authorized"})
// }

const addMovie = (req, res) => {
    Movie.create({
        movie_id: req.body.movie_id,
        data: req.body.movie,
        tags: req.body.tags,
        })
        .then((result) => res.send(result)) 
}


/// Get Full Info Lists
const getListComplete = async (req,res) => {    

    Playlist.findById( req.params.playlist_id )
        .then(async (info) => {          
            const publicPlaylists = info.movies
            const newPublicPlaylists = await Movie.find({ 'movie_id': { $in: publicPlaylists } });
            res.json({...info._doc,["public"]: newPublicPlaylists})
        })
        .catch((e) =>  {
            console.log(e)
            res.status(500).send() 
        })
}

// const getListComplete = async (req,res) => {    
//     let movieIds = ['']
    
//     Playlist.findById( req.params.playlist_id )
//     .then((list) => {
//         console.log(list )
//         movieIds = list
//         Movie.find({})
//             .then((result) => {
//                 function isCherries (index, object){
//                 return (object) => {return object.movie_id === index }
//                 }
//                 const movies = movieIds.movies.map((id)=> result.find(isCherries(id)) )
//                 const listComplete = {...list._doc, ["movies_full"]:movies} 
//                     res.json(listComplete)
//             })
//     })
// }

const getAllListsComplete = async (req,res) => {    

    User.findOne( { userName: req.params.userName })
        .select('watchlist blacklist privateLists publicLists')
        .then( async (info) => {
            const privatePlaylists =  info.privateLists
            const publicPlaylists = info.publicLists
            const newPrivatePlaylists = await Playlist.find({ '_id': { $in: privatePlaylists } });
            const newPublicPlaylists = await Playlist.find({ '_id': { $in: publicPlaylists } });
            res.json({...info._doc,["private"]: newPrivatePlaylists,["public"]: newPublicPlaylists})
        })
        .catch((e) => {
            console.log(e);
            res.send({ Error });
        })
}

const getPublicListComplete = async (req,res) => {    

    User.findOne( { userName: req.params.userName })
        .select('publicLists')
        .then(async (info) => {          
            const publicPlaylists = info.publicLists
            const newPublicPlaylists = await Playlist.find({ '_id': { $in: publicPlaylists } });
            res.json({...info._doc,["public"]: newPublicPlaylists})
        })
        .catch((e) =>  {
            console.log(e)
            res.status(500).send() 
        })
}

const getPublicLists =  (req,res) => {    

    Playlist.find({public : true })
            .then(async (info) => {
                const newInfo = await Promise.all( 
                    info.map( async (list) => {
                        const publicMovies = list.movies
                        const newPublicMovies = await Movie.find({ 'movie_id': { $in: publicMovies } });
                        const getMeOut = {...list._doc,["movies_full"]: newPublicMovies}
                        return getMeOut
                    }))      
                res.json({status:200,result:newInfo})
                })
                .catch((e) =>  {
                    console.log(e)
                    res.status(500).send() 
            })
            
}

const getTags = (req,res) => {
    const tags = req.params.tag.split('&')
    console.log( tags)
    
    Playlist.find({ tags: { $in: tags } })
            .then((result) => res.json({status:200,result:result}))
            .catch((e) =>  {
                console.log(e)
                res.status(500).send() 
            })

}

const getListsMoviesFull =  (req,res) => {    

    Playlist.find({ editRight: { $in: "gerardo" } })
            .then(async (info) => {
                const newInfo = await Promise.all( 
                    info.map( async (list) => {
                        const publicMovies = list.movies
                        const newPublicMovies = await Movie.find({ 'movie_id': { $in: publicMovies } });
                        const getMeOut = {...list._doc,["movies_full"]: newPublicMovies}
                        return getMeOut
                    }))      
                res.json({status:200,result:newInfo})
                })
                .catch((e) =>  {
                    console.log(e)
                    res.status(500).send() 
            })
            
}
const getPrivateListComplete = async (req,res) => {    

    User.findOne( { userName: req.params.userName })
        .select('privateLists')
        .then(async (info) => {          
            const publicPlaylists = info.privateLists
            const newPublicPlaylists = await Playlist.find({ '_id': { $in: publicPlaylists } });
            res.json({...info._doc,["private"]: newPublicPlaylists})
        })
        .catch((e) =>  {
            console.log(e)
            res.status(500).send() 
        })
}

const getPublicMoviesFull = async (req,res) => {    

    User.findOne( { userName: req.params.userName })
        .select('publicLists')
        .then(async (info) => {          
            const publicPlaylists = info.publicLists
            const newPublicPlaylists = await Playlist.find({ '_id': { $in: publicPlaylists } });
            res.json({...info._doc,["public"]: newPublicPlaylists})
        })
        .catch((e) =>  {
            console.log(e)
            res.status(500).send() 
        })
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
    getOnePlaylist,
    getListComplete,
    getAllListsComplete,
    getPublicListComplete,
    getPublicLists,
    getTags,
    getListsMoviesFull,
    getPrivateListComplete,
    getPublicMoviesFull
}
