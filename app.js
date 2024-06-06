const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");
require("dotenv").config();
const multer = require("multer");
const { storage, cloudinary } = require("./cloudConfig");
const upload = multer({ storage });
const Company = require("./models/company");
const Intern = require("./models/intern");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const localStorage = require('localStorage');
const ExpressErr = require("./utilis/expressErr");

//verify Token middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log(token);
    if (!token) {
      return res.redirect('/login');
    }
    jwt.verify(token, 'veryTopSecret', (err, decoded) => {
      if (err) {
        console.log(err);
        return res.redirect('/login');
      }
      req.user = decoded; // Attach the decoded token data to the request object
      next();
    });
};


//middlewares
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine('ejs', ejsMate);
app.use(cookieParser());

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

//jwt token
const maxAge = 2 * 30 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, "veryTopSecret", {
        expiresIn: maxAge
    });
}

//calling APIs here:

app.get("/signup", (req, res) => {
    res.render("./listings/signup.ejs");
})

app.post("/signup", (req, res) => {
    let { suggestion } = req.body;
    if (suggestion == "company") {
        return res.render("./listings/signupcompany.ejs");
    }
    else if (suggestion == "intern") {
        return res.render("./listings/signupintern.ejs");
    } else {
        req.flash("error", "Invalid field");
        return res.redirect("/signup");
    }
})

app.post("/signup-company", upload.single('image'), async (req, res) => {
    let { nameofcompany, email, password, websitelink, phone, location, requirement, industry, companysize, founded } = req.body;
    let photos = req.file.path;
    let isMatch = await Company.findOne({ nameofcompany: nameofcompany, email: email });
    if (isMatch) {
        req.flash("error", "Company already exists");
        return res.redirect("/signup");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await new Company({ nameofcompany: nameofcompany, email: email, password: hashedPassword, websitelink: websitelink, phone: phone, photos: photos, location: location, requirement: requirement, industry: industry, companysize: companysize, founded: founded });

    await user.save();

    const token = createToken(Company._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Company registered successfully");
    res.send(req.file.path);
});


app.post("/signup-intern", upload.single('photos'), async (req, res) => {
    let { username, email, password, mobilenumber, education, experience } = req.body;
    let photos = req.file.path;

    let match = await Intern.findOne({ username: username, email: email });
    if (match) {
        req.flash("error", "User already exist");
        return res.redirect("/signup");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = new Intern({ username: username, email: email, password: hashedPassword, photos: photos, mobilenumber: mobilenumber, education: education, experience: experience });

    await user.save();

    const token = createToken(Intern._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Intern registered successfully please login once to complete Authorization");
    res.send(req.file.path);
});



app.get("/login", (req, res) => {
    res.render("./listings/login.ejs");
})

app.post("/login", (req, res) => {
    let { suggestion } = req.body;
    if (suggestion == "company") {
        return res.render("./listings/logincompany.ejs");
    }
    else if (suggestion == "intern") {
        return res.render("./listings/loginintern.ejs");
    } else {
        req.flash("error", "Invalid field");
        return res.redirect("/signup");
    }
})

app.post("/login-intern", async (req, res) => {
    let { email, password } = req.body;
    const user = await Intern.findOne({ email: email });
    
    if (!user) {
        req.flash("error", "User not found. Please signup first");
        return res.redirect('/signup');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { 
        req.flash("error", "Invalid password please try again latter");
        return res.redirect("/login");
    };

    const token = createToken(Intern._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Login successfully");
    res.redirect("/");
});

app.post("/login-company", async (req, res) => {
    let { email, password } = req.body;
    const user = await Company.findOne({ email: email });
    if (!user) {
        req.flash("error", "User not found. Please signup first");
        return res.redirect('/signup');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        req.flash("error", "Invalid password please try again latter");
        return res.redirect("/login");
    };

    const token = createToken(Company._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Login successfully");
    res.redirect("/");
})

app.get("/company", async (req, res) => {
    let allCompany = await Company.find({});
    res.render("./listings2/company-index.ejs", {allCompany});
});

app.get("/:id/company", async (req, res) => {
    let id = req.params.id;
    let company = await Company.findById(id);
    res.render("./others/company-profile.ejs", {company});
})



app.get("/", (req, res) => {
    res.render("./listings/index.ejs");
});

app.all("*", (req, res, next) => {
    next(new ExpressErr(404, "Page Not Found.!"))
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went to wrong" } = err;
    res.status(statusCode).render("./listings/error.ejs", { message });
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log("server start on port number 3000");
});
