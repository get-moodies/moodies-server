const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User =  require('./models/User.js')

// const landingAPI = (req, res) => res.send(
//     `<h1>Welcome to the HP world</h1><br/>
//     <p>Check out our neat API's:</p>
//     <ul>
//     <li >with PostgreSQL @ <a href="http://localhost:3007/api/characters" className="h">api/characters</a> , and </li>
//     <li >with MongoDB @ <a href="http://localhost:3007/apiMDB/characters"> apiMDB/characters </a></li>
//     </ul>
//   `)

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

const edit = (req, res) => {
User.findOneAndUpdate(
    req.params.userName,
    {
        userName: req.body.userName,
        email: req.body.email,
    },
    { returnDocument: "after" }
    )
    .then((result) => {
    res.send(`Updated entry. Entry's title: ${result.name}`)})
    .catch((e) => {
    console.log(e);
    res.send({ Error });
    });
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
    User.findOne( { userName: req.params.userName }).select("userName")
        .then((result) => res.send(result))
        .catch((e) => {
        console.log(e);
        res.send({ Error});
        })
    }

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
    

module.exports = {
    getAll:getAll , 
    addUser:addUser, 
    getOne:getOne, 
    edit:edit, 
    delOne:delOne, 
    compare: compare,
    getPublicProfile:getPublicProfile,
    auhtenticateToken:auhtenticateToken
}