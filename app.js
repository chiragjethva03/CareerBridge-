const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require('connect-mongo');
require("dotenv").config();
const multer = require("multer");
const { storage, cloudinary } = require("./cloudConfig");
const upload = multer({ storage });

const Company = require("./models/company");
const Intern = require("./models/intern");
const Form = require("./models/applyForm");

const authenticationRoutes = require("./routes/authentication");
const companyRoutes = require("./routes/company")
const internRoutes = require("./routes/Intern");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ExpressErr = require("./utilis/expressErr");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

// Middleware functions
function setAuthStatus(req, res, next) {
    const token = req.cookies.jwt;
    res.locals.isAuthenticated = !!token;
    next();
}

async function getUserDetailsFromToken(req, res, next) {
    try {
        const token = req.cookies.jwt;
        res.locals.isAuthenticated = false;
        res.locals.user = null;
        res.locals.isCompany = false;
        res.locals.isIntern = false;

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, 'veryTopSecret');
        if (decoded) {
            let user = await Intern.findById(decoded.id);
            if (!user) {
                user = await Company.findById(decoded.id);
            }

            if (user) {
                res.locals.isAuthenticated = true;
                res.locals.user = user;
                res.locals.isCompany = user instanceof Company;
                res.locals.isIntern = user instanceof Intern;
                next();
            } else {
                return res.status(404).json({ error: 'User not found' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid token format' });
        }
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}



// middlewares
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine('ejs', ejsMate);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// const store = MongoStore.create({
//     mongoUrl: dbUrl,
//     crypto: {
//         secret: process.env.SECRET
//     },
//     touchAfter: 24 * 3600,
// })

// store.on("error", () => {
//     console.log("ERROR IN MONGO SESSION STORE");
// })

// store session 
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

// for the cookie passing 
app.use(session(sessionOption));

// for flash message
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});

// connection of MongoDB
mongoose.connect("mongodb://localhost:27017/careerbridge", {
    useNewUrlParser: true,

    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connection established");
}).catch(err => {
    console.log("MongoDB connection error:", err);
});

app.use(setAuthStatus);
app.use(getUserDetailsFromToken);

//define Routes here
app.use("/", authenticationRoutes);
app.use("/", companyRoutes);
app.use("/", internRoutes);


app.get("/", (req, res) => {
    res.render("./listings/index.ejs");
});

app.all("*", (req, res, next) => {
    next(new ExpressErr(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("./listings/error.ejs", { message });
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
