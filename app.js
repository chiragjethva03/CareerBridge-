const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");
const dotenv = require("dotenv").config();
const multer = require("multer");
const {storage, cloudinary} = require("./cloudConfig");
const upload = multer({ storage: storage });

//middlewares
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

//store session 
const sessionOption = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}
//for the cookie passing 
app.use(session(sessionOption));

//for flash message
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

//connection of mongoDB
main()
    .then(() => {
        console.log("connections Established");
    })
    .catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/careerbridge');
}


//calling APIs here:

app.get("/signup", (req, res) => {
    res.render("./listings/signup.ejs");
})

app.post("/signup", (req, res) => {
    let { suggestion } = req.body;
    if(suggestion == "company"){
        return res.render("./listings/signupcompany.ejs");
    }
    else if (suggestion == "intern"){
        return res.render("./listings/signupintern.ejs");
    } else{
        req.flash("error", "Invalid field");
        return res.redirect("/signup");
    }
})

app.post("/signup-company",upload.single('image'), (req, res) => {
    let { nameofcompany, email, password, websitelink, phone, location, requirement} = req.body;
    console.log(nameofcompany, email, password, websitelink, phone, location, requirement);
    console.log(req.file);
    res.send(req.file);
});

app.get("/", (req, res) => {
    res.render("./listings/index.ejs");
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log("server start on port number 3000");
});
