const express = require("express");
const Company = require("../models/company");
const Intern = require("../models/intern");
const Form = require("../models/applyForm");

module.exports.get_Applicant = async (req, res) => {
    try {
        const userData = req.query.userData;
        let currentUser = null;
        let userId = null;
        let userType = null;
        let userDetails = null;
        let forms = [];

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
            const applicantIds = userDetails.applicants.map(candidate => candidate.toString());

            if (applicantIds) {
                forms = await Form.find({ _id: { $in: applicantIds } }).exec();
            }

        } else {
            console.log("User not found in either collection.");
        }

        let internDetailsArray = [];
        for (const form of forms) {
            let idIntern = form.intern.toString();
            const internDetails = await Intern.findById(idIntern);
            internDetailsArray.push(internDetails);
        }
        const internDetails = internDetailsArray;
        console.log(internDetails);
        console.log(forms);
        res.render("./listings2/applicants.ejs", { userDetails, internDetails, forms });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
}