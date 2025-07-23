const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
require("dotenv").config();

const app = express();

// Import cloudinary storage and models
const { storage } = require("./cloudConfig");
const upload = multer({ storage });

const Company = require("./models/company");
const Intern = require("./models/intern");

// Import routes
const authenticationRoutes = require("./routes/authentication");
const companyRoutes = require("./routes/company");
const internRoutes = require("./routes/Intern");

// Import custom error
const ExpressErr = require("./utilis/expressErr");

// Middleware to check login status
function setAuthStatus(req, res, next) {
    const token = req.cookies.jwt;
    res.locals.isAuthenticated = !!token;
    next();
}

// Middleware to extract user details from JWT
async function getUserDetailsFromToken(req, res, next) {
    try {
        const token = req.cookies.jwt;
        res.locals.isAuthenticated = false;
        res.locals.user = null;
        res.locals.isCompany = false;
        res.locals.isIntern = false;

        if (!token) return next();

        const decoded = jwt.verify(token, 'veryTopSecret');

        let user = await Intern.findById(decoded.id) || await Company.findById(decoded.id);

        if (user) {
            res.locals.isAuthenticated = true;
            res.locals.user = user;
            res.locals.isCompany = user instanceof Company;
            res.locals.isIntern = user instanceof Intern;
            return next();
        } else {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Set view engine and static path
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// General middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// ✅ MongoDB Connection
const dbUrl = process.env.ATLASDB_URL;

mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 5000, // timeout after 5s
}).then(() => {
    console.log("✅ MongoDB connection established");
}).catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
});

// ✅ Session Store Configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600,
});
store.on("error", () => {
    console.log("⚠️ Session store error");
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
    },
};
app.use(session(sessionOptions));

// Flash messages
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});

// Auth middlewares
app.use(setAuthStatus);
app.use(getUserDetailsFromToken);

// Routes
app.use("/", authenticationRoutes);
app.use("/", companyRoutes);
app.use("/", internRoutes);

// Home route
app.get("/", (req, res) => {
    res.render("./listings/index.ejs");
});

// 404 handler
app.all("*", (req, res, next) => {
    next(new ExpressErr(404, "Page Not Found!"));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("./listings/error.ejs", { message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
