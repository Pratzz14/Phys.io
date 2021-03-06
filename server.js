const { name } = require('ejs')
const express = require('express')
const app = express()
require("dotenv").config()

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET
const jwt_decode = require("jwt-decode")

const cookieParser = require("cookie-parser");

const User = require("./model/user")
const Profile = require("./model/profile")
const mongoose = require("mongoose")
const path = require("path")
mongoose.connect("mongodb://localhost:27017/login-db")

const { uploadFile, getFileStream } = require("./s3")

app.use(express.static(__dirname+'/views'))
app.use(express.static(__dirname+'/uploads'))

app.use(cookieParser());

app.set('views', path.join(__dirname,'views'))
app.set("view engine","ejs")
app.use(express.urlencoded({ extended: true }))

const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads/')
    },
    // filename: function(req,file,cb){
    //     cb(null, file.originalname)
    //     // cb(null, req.body.username + ".png")
    // }
})

const fileFilter = (req,file,cb) => {
    if(file.mimetype==='image/jpeg' || file.mimetype==='image/png'){
        cb(null,true)
    }else{
        cb(null,false)
    }
}

const upload = multer({
    storage: storage,
    limits:{
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
})

app.get('/', (req,res)=> {
    res.render("home",{name:"Pratik"})
})

//logout
app.get('/logout',(req,res)=>{

    res.clearCookie("physio")
    res.redirect("login")
})

//login
app.get('/login', (req,res)=> {
    
    res.render("login")
})

app.post('/login', async (req,res)=>{

    const {email, password} = req.body 

    const user = await User.findOne({email}).lean()
    console.log(user)

    if(!user){
        return res.json({status:"error", message:"Incorrect email address"})
    }

    if(await bcrypt.compare(password,user.passwd)){

        const token = jwt.sign({
            id: user._id
        },JWT_SECRET)

        res.cookie("physio",token)

        return res.redirect("user")
    }else{
        return res.json({status:"error", message:"Password is incorrect"})
    }
    
    
})

//register
app.get('/register', (req,res)=> {

    
    
    res.render("register")
})

app.post('/register', async (req,res)=>{

    const {name,email,password,confpaswd} = req.body

    if(!name || typeof name !== 'string'){
        return res.json({
            status: "error",
            message: "Invalid username"
        })
    }

    if(!password || typeof password !== 'string'){
        return res.json({
            status: "error",
            message: "Invalid password"
        })
    }

    if(password.length < 5){
        return res.json({
            status: "error",
            message: "Password length should be greater than 5. "
        })
    }


    const passwd = await bcrypt.hash(password,1)

    console.log(name)
    console.log(email)
    console.log(passwd)

    try {

        const db_response = await User.create({
            email,
            name,
            passwd
        })

        const fullname =  ""
        const phone = ""
        const age =  0
        const weight =  0
        const height =  0
        const gender =  "male"
        const Specify = ""
        const pain_range =  {
            neck: 0 ,
            shoulder: 0,
            elbow: 0,
            back: 0,
            knee: 0,
            ankle: 0
        },
        profile_pic = "bg-reg.png"

        console.log("User created",db_response)

        idd = db_response._id
        const profile_response = await Profile.create({
            idd,
            email,
            name

        })

        
        console.log("Profile created",profile_response)
        
    } catch (error) {
        console.log(JSON.stringify(error))
        if(error.code === 11000){
            return res.json({
                status: "error",
                message: "User or email already exists"
            })
        }
        return res.json({status:"error"})
    }

    return res.redirect("login")
})

//client dashboard
app.get('/user', async(req,res)=> {

    const token = req.cookies
    if (!token.physio){
        return res.redirect("login")
    }

    const user_id = jwt_decode(token.physio)
    const user = await User.findOne({_id: user_id.id})
    const prof = await Profile.findOne({name: user.name})

    res.render("clientdash", {user:prof})
})

//update profile
app.get('/updateProfile', async(req,res)=> {

    const token = req.cookies
    if (!token.physio){
        return res.redirect("login")
    }

    const user_id = jwt_decode(token.physio)
    const user = await User.findOne({_id: user_id.id})
    const prof = await Profile.findOne({name: user.name})
    
    res.render("updateProfile", {user:prof})
})

app.post('/updateProfile', upload.single('filename') , async (req,res)=>{

    const token = req.cookies
    const user_id = jwt_decode(token.physio)
    const user = await User.findOne({_id: user_id.id})

    const {name:fullname,phone,age,weight,height,gender,Specify,neck_pain,shoulder_pain,elbow_pain,back_pain,knee_pain,ankle_pain} = req.body
    pic_link = user.name + ".png"

    const file = req.file
    const result = await uploadFile(file)
    console.log(result)

    const filter = {name:user.name}
    const update = {
        fullname: fullname,
        phone: phone,
        age: parseInt(age),
        weight: parseInt(weight),
        height: parseInt(height),
        gender: gender,
        Specify: Specify,
        pain_range: {
            neck: parseInt(neck_pain),
            shoulder: parseInt(shoulder_pain),
            elbow: parseInt(elbow_pain),
            back: parseInt(back_pain),
            knee:parseInt(knee_pain),
            ankle: parseInt(ankle_pain)
        },
        profile_pic: result.Location
    }

    const prof = await Profile.findOneAndUpdate(filter,update)
    console.log(prof)

    console.log(req.body)
    console.log(req.file)

    

    res.redirect("user")

})

app.get('/shoulder1',  (req, res) => {

    res.render('test.ejs')
  })

app.get('/back_auto',  (req, res) => {

    res.render('test1.ejs')
})

var videos = {
    "neck1":"https://www.youtube.com/embed/iwPsbH5yFc4",
    "shoulder1":"https://www.youtube.com/embed/FnOq_VZm-nk",
    "elbow1":"https://www.youtube.com/embed/Lf695_IJO8g",
    "back1":"https://www.youtube.com/embed/Ip0S-HHQIoc",
    "knee1":"https://www.youtube.com/embed/pOrc3zADC7k",
    "ankle1":"https://www.youtube.com/embed/hEmLp6iQB7M"
}

app.get('/neck1',  (req, res) => {
    res.render('exercise.ejs', {exercise: videos["neck1"],name:"Neck Exercise: 1"})    
})

app.get('/shoulder2',  (req, res) => {
    res.render('exercise.ejs', {exercise: videos["shoulder1"],name:"Shoulder Exercise: 1"})    
})

app.get('/elbow1',  (req, res) => {
    res.render('exercise.ejs', {exercise: videos["elbow1"],name:"Elbow Exercise: 1"})    
})

app.get('/back1',  (req, res) => {
    res.render('exercise.ejs', {exercise: videos["back1"],name:"Back Exercise: 1"})    
})

app.get('/knee1',  (req, res) => {
    res.render('exercise.ejs', {exercise: videos["knee1"],name:"Knee Exercise: 1"})    
})

app.get('/ankle1',  (req, res) => {
    res.render('exercise.ejs', {exercise: videos["ankle1"],name:"Ankle Exercise: 1"})    
})

app.listen(3000)