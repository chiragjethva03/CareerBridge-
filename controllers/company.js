const express = require("express");
const Company = require("../models/company");
const Intern = require("../models/intern");
const Form = require("../models/applyForm");
const jwt = require("jsonwebtoken");

module.exports.Company = async (req, res) => {
    try {
        const allCompany = await Company.find({});

        const userData = req.query.userData;
        let currentUser = null;
        let userId = null;
        let userType = null;
        let userDetails = null;

        if (userData) {
            try {
                currentUser = JSON.parse(decodeURIComponent(userData));
                userId = currentUser._id;
            } catch (error) {
                console.error("Invalid userData received:", error);
                currentUser = null;
                userId = null;
            }
        }

        if (currentUser && currentUser._id) {
            console.log("Current User ID:", currentUser._id);
        } else {
            console.log("No valid current user data available.");
        }

        const id = userId;
        if (id) {
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

        if (userDetails) {
            console.log(`Current User Type: ${userType}`);
        } else {
            console.log("User not found in either collection.");
        }

        res.render("./listings2/company-index.ejs", { allCompany, userDetails });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
}


// click arrow to show more details for company 
module.exports.getIdCompany = async (req, res) => {
    let { id } = req.params;
    let company = await Company.findById(id);
    res.render("./listings/aboutCompany.ejs", { company });
}

// For profile images
module.exports.showProfile = async (req, res) => {
    let { id } = req.params;

    if (id) {
        const company = await Company.findById(id);
        if (company) {
            return res.render("./others/companyprofile.ejs", { userDetails: company });
        } else {
            const intern = await Intern.findById(id);
            if (intern) {
                return res.render("./others/userprofile.ejs", { userDetails: intern });
            }
        }
    }
}

// get form for editing 
module.exports.getEdit = async (req, res) => {
    let { id } = req.params;

    if (id) {
        const company = await Company.findById(id);
        if (company) {
            return res.render("./listings/companyEdit.ejs", { userDetails: company });
        } else {
            const intern = await Intern.findById(id);
            if (intern) {
                return res.render("./listings/internEdit.ejs", { userDetails: intern });
            }
        }
    }
}

// put request for editing 
module.exports.putEdit = async (req, res) => {
    let { id } = req.params;
    let updatedFields = req.body;

    if (id) {
        let userType, userDetails;

        if (req.file) {
            updatedFields.photo = req.file.path;
        }

        let company = await Company.findByIdAndUpdate(id, updatedFields, { new: true });

        if (company) {
            userType = 'company';
            userDetails = company;
        } else {
            let intern = await Intern.findByIdAndUpdate(id, updatedFields, { new: true });

            if (intern) {
                userType = 'intern';
                userDetails = intern;
            }
        }

        if (userDetails) {
            req.flash("success", "Updated!");
            return res.redirect(`/profile/${id}`);
        }
    }

    req.flash("error", "Update failed!");
    res.redirect(`/profile/${id}`);
}

//apply form
module.exports.apply_Form = async (req, res) => {
    const { id } = req.params;
    let forId = await Company.findById(id);
    res.render("./listings/applyform.ejs", { forId });
}

module.exports.post_Form = async (req, res) => {
    const { id } = req.params;
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, 'veryTopSecret');
        const internId = decoded.id;
        console.log(internId);

        const existingApplication = await Form.findOne({ company: id, intern: internId });
        if (existingApplication) {
            req.flash("error", "You have already submitted an application to this company.");
            return res.redirect(`/${id}/company`);
        }

        // Create a new application
        let allInformation = req.body;
        allInformation.company = id;
        allInformation.intern = internId;

        let newApplication = new Form(allInformation);
        await newApplication.save();

        // Associate the application with the company
        let company = await Company.findById(id);
        if (!company) {
            req.flash("error", "company not found");
        }
        company.applicants.push(newApplication._id);
        await company.save();

        req.flash("success", "Form submitted successfully");
        res.redirect(`/${id}/company`);

    } catch (error) {
        console.error('Error in application submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}