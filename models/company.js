const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    nameofcompany: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String
    },
    websitelink: {
        type: String
    },
    phone: {
        type: Number
    },
    photos: {
        type: String,
    },
    location: {
        type: String
    },
    requirement: {
        type: String
    },
    industry: {
        type: String
    },
    companysize: {
        type: Number
    },
    founded: {
        type: Number
    },
    role: {
        type: String,
        default: 'company'
    },

});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;