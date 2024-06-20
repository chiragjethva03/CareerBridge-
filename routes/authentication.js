const express = require("express");
const routes = express.Router();
const bcrypt = require("bcrypt");
const Company = require("../models/company");
const Intern = require("../models/intern");
const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });
const authenticationController = require("../controllers/authentication");


// signup for user and company
routes.get("/signup", authenticationController.getSignup);

routes.post("/signup", authenticationController.postSignup);

routes.post("/signup-company", upload.single('image'), authenticationController.postSignCompany);

routes.post("/signup-intern", upload.single('photos'), authenticationController.postSignIntern);

// login for user and company
routes.get("/login", authenticationController.getLogin)

routes.post("/login", authenticationController.postLogin)

routes.post("/login-intern", authenticationController.postInterLogin);

routes.post("/login-company", authenticationController.postCompnayLogin)

// logout
routes.get("/logout", authenticationController.logout);


module.exports = routes;