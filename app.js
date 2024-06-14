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
const ExpressErr = require("./utilis/expressErr");
const bodyParser = require("body-parser");
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const methodOverride = require("method-override");

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

//check token exist or not middleware
function setAuthStatus(req, res, next) {
    const token = req.cookies.jwt;
    res.locals.isAuthenticated = !!token;
    next();
}

//check existing user is company or candiadtes
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

        try {
            const decoded = jwt.verify(token, 'veryTopSecret');
            console.log(decoded.id);
            if (decoded) {
                let user = await Intern.findById(decoded.id);
                if (!user) {
                    user = await Company.findById(decoded.id); // If 
                }

                if (user) {
                    console.log(user);
                    res.locals.isAuthenticated = true;
                    res.locals.user = user;
                    res.locals.isCompany = user.role === 'company';
                    res.locals.isIntern = user.role === 'intern';
                    console.log('User Role:', user.role);
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
    } catch (err) {
        console.error('Error in getUserDetailsFromToken middleware:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
    next();
}


//middlewares
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine('ejs', ejsMate);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(getUserDetailsFromToken);
app.use(setAuthStatus);

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
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
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


//signup for user and company
app.get("/signup", (req, res) => {
    res.render("./listings/signup.ejs");
})

app.post("/signup", (req, res) => {
    let { suggestion } = req.body;
    if (suggestion == "company") {
        return res.render("./listings/signupcompany.ejs");
    }
    else if (suggestion == "candidate") {
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

    req.flash("success", "Intern registered successfully please login once to complete Authorization");
    res.redirect("/login");
});


app.post("/signup-intern", upload.single('photos'), async (req, res) => {
    let { username, email, password, mobilenumber, education, experience, about } = req.body;
    let photos = req.file.path;

    let match = await Intern.findOne({ username: username, email: email });
    if (match) {
        req.flash("error", "User already exist");
        return res.redirect("/signup");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = new Intern({ username: username, email: email, password: hashedPassword, photos: photos, mobilenumber: mobilenumber, education: education, experience: experience, about: about });

    await user.save();

    const token = createToken(Intern._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Intern registered successfully please login once to complete Authorization");
    res.redirect("/login");
});


//login for uesr and company
app.get("/login", (req, res) => {
    res.render("./listings/login.ejs");
})

app.post("/login", (req, res) => {
    let { suggestion } = req.body;
    if (suggestion == "company") {
        return res.render("./listings/logincompany.ejs");
    }
    else if (suggestion == "candidate") {
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
        return res.status(404).json({
            success: false,
            message: "User not found. Please signup first",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        req.flash("error", "Invalid Password. Please try again latter");
        return res.status(401).json({
            success: false,
            message: "Invalid password, please try again"
        });
    };

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });


    req.flash("success", "User Login Successfully.!");
    return res.status(200).json({
        success: true,
        message: "Login successfully",
        user: user
    });


});

app.post("/login-company", async (req, res) => {
    let { email, password } = req.body;
    const user = await Company.findOne({ email: email });
    if (!user) {
        req.flash("error", "User not found. Please signup first");
        return res.status(404).json({
            success: false,
            message: "User not found. Please signup first",
        });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        req.flash("error", "Invalid Password. Please try again latter");
        return res.status(401).json({
            success: false,
            message: "Invalid password, please try again"
        });
    };

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "User Login Successfully.!");
    return res.status(200).json({
        success: true,
        message: "Login successfully",
        user: user
    });
})


//logout
app.get("/logout", (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/")
});

//APIs request for finding company list for user
app.get("/company", async (req, res) => {
    try {
        // Fetch all companies from the database
        const allCompany = await Company.find({});

        // Retrieve and decode the user data from the query parameter
        const userData = req.query.userData;
        let currentUser = null;
        let userId = null;
        let userType = null;
        let userDetails = null;

        if (userData) {
            try {
                currentUser = JSON.parse(decodeURIComponent(userData));
                userId = currentUser._id; // Access the user id
            } catch (error) {
                console.error("Invalid userData received:", error);
                // Handle this scenario as needed
                currentUser = null;
                userId = null;
            }
        }

        // Log the current user and user ID
        if (currentUser && currentUser._id) {
            console.log("Current User ID:", currentUser._id);
        } else {
            console.log("No valid current user data available.");
        }

        const id = userId;
        if (id) {
            // Try to find the user in both collections
            const company = await Company.findById(id);
            if (company) {
                userType = 'company';
                userDetails = company;
            } else {
                const intern = await Intern.findById(id);
                if (intern) {
                    userType = 'intern';
                    userDetails = intern;
                }
            }
        }

        // Log the user type and details
        if (userDetails) {
            console.log(`Current User Type: ${userType}`);
            console.log(`Current User Details: ${(userDetails)}`);
        } else {
            console.log("User not found in either collection.");
        }

        console.log(userDetails);
        // Render the template with the fetched data and current user id
        res.render("./listings2/company-index.ejs", { allCompany, userDetails });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//For profile images
app.get("/profile/:id", async (req, res) => {
    let { id } = req.params;

    if (id) {
        const company = await Company.findById(id);
        if (company) {
            userType = 'company';
            userDetails = company;
            return res.render("./others/companyprofile.ejs", { userDetails })
        } else {
            const intern = await Intern.findById(id);
            if (intern) {
                userType = 'intern';
                userDetails = intern;
                return res.render("./others/userprofile.ejs", { userDetails });
            }
        }
    }
});

//get form for editing 
app.get("/edit/:id", async (req, res) => {
    let { id } = req.params;

    if (id) {
        const company = await Company.findById(id);
        if (company) {
            userType = 'company';
            userDetails = company;
            return res.render("./listings/companyEdit.ejs", { userDetails });
        } else {
            const intern = await Intern.findById(id);
            if (intern) {
                userType = 'intern';
                userDetails = intern;
                return res.render("./listings/internEdit.ejs", { userDetails });
            }
        }
    }

});

//put request for editing 
app.put("/:id/edit", upload.single('photos'), async (req, res) => {
    let { id } = req.params;
    let updatedFields = req.body;
    console.log(updatedFields);
    if (id) {
        let userType, userDetails;

        // If you are using the file upload, handle the file here
        if (req.file) {
            updatedFields.photo = req.file.path;
        }

        // Attempt to find and update the company
        let company = await Company.findByIdAndUpdate(id, updatedFields, { new: true });

        if (company) {
            userType = 'company';
            userDetails = company;
        } else {
            // If not found in company, attempt to find and update the intern
            let intern = await Intern.findByIdAndUpdate(id, updatedFields, { new: true });

            if (intern) {
                userType = 'intern';
                userDetails = intern;
            }
        }

        if (userDetails) {
            req.flash("success", "Updated..!");
            return res.redirect(`/profile/${id}`);
        }
    }

    req.flash("error", "Update failed..!");
    res.redirect(`/profile/${id}`);
});

//click arrow to show more details for company 
app.get("/:id/company", async (req, res) => {
    let id = req.params.id;
    let company = await Company.findById(id);
    res.render("./others/aboutCompany.ejs", { company });
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

const PORT = 8080;
app.listen(PORT, () => {
    console.log("server start on port number 3000");
});