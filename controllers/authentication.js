const express = require("express");
const Company = require("../models/company");
const Intern = require("../models/intern");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// jwt token
const maxAge = 2 * 30 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "veryTopSecret", {
        expiresIn: maxAge
    });
}


module.exports.getSignup = (req, res) => {
    res.render("./listings/signup.ejs");
}

module.exports.postSignup = (req, res) => {
    let { suggestion } = req.body;
    if (suggestion == "company") {
        return res.render("./listings/signupcompany.ejs");
    } else if (suggestion == "candidate") {
        return res.render("./listings/signupintern.ejs");
    } else {
        req.flash("error", "Invalid field");
        return res.redirect("/signup");
    }
}

module.exports.postSignCompany = async (req, res) => {
    let { nameofcompany, email, password, websitelink, phone, location, requirement, industry, companysize, founded } = req.body;
    let photos = req.file.path;
    let isMatch = await Company.findOne({ nameofcompany, email });
    if (isMatch) {
        req.flash("error", "Company already exists");
        return res.redirect("/signup");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = new Company({
        nameofcompany,
        email,
        password: hashedPassword,
        websitelink,
        phone,
        photos,
        location,
        requirement,
        industry,
        companysize,
        founded
    });

    await user.save();

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Company registered successfully, please login to complete Authorization");
    res.redirect("/login");
}

module.exports.postSignIntern = async (req, res) => {
    let { username, email, password, mobilenumber, education, experience, about } = req.body;
    let photos = req.file.path;

    let match = await Intern.findOne({ username, email });
    if (match) {
        req.flash("error", "User already exists");
        return res.redirect("/signup");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = new Intern({
        username,
        email,
        password: hashedPassword,
        photos,
        mobilenumber,
        education,
        experience,
        about
    });

    await user.save();

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "Intern registered successfully, please login to complete Authorization");
    res.redirect("/login");
}

module.exports.getLogin = (req, res) => {
    res.render("./listings/login.ejs");
}

module.exports.postLogin = (req, res) => {
    let { suggestion } = req.body;
    if (suggestion == "company") {
        return res.render("./listings/logincompany.ejs");
    } else if (suggestion == "candidate") {
        return res.render("./listings/loginintern.ejs");
    } else {
        req.flash("error", "Invalid field");
        return res.redirect("/signup");
    }
}

module.exports.postInterLogin = async (req, res) => {
    let { email, password } = req.body;

    const user = await Intern.findOne({ email });
    if (!user) {
        req.flash("error", "User not found. Please signup first");
        return res.status(404).json({
            success: false,
            message: "User not found. Please signup first",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        req.flash("error", "Invalid Password. Please try again later");
        return res.status(401).json({
            success: false,
            message: "Invalid password, please try again"
        });
    };

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "User Login Successfully!");
    return res.status(200).json({
        success: true,
        message: "Login successfully",
        user
    });
}

module.exports.postCompnayLogin = async (req, res) => {
    let { email, password } = req.body;
    const user = await Company.findOne({ email });
    if (!user) {
        req.flash("error", "User not found. Please signup first");
        return res.status(404).json({
            success: false,
            message: "User not found. Please signup first",
        });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        req.flash("error", "Invalid Password. Please try again later");
        return res.status(401).json({
            success: false,
            message: "Invalid password, please try again"
        });
    };

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    req.flash("success", "User Login Successfully!");
    return res.status(200).json({
        success: true,
        message: "Login successfully",
        user
    });
}

module.exports.logout = (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
}