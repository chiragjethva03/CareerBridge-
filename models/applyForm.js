const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    address: {
        type: String,
    },
    phone: {
        type: Number
    },
    email: {
        type: String
    },
    dob: {
        type: Date
    },
    position: {
        type: String
    },
    salary: {
        type: String
    },
    startDate: {
        type: Date
    },
    employmentType: {
        type: String
    },
    highSchool: {
        type: String
    },
    highSchoolLocation: {
        type: String
    },
    college: {
        type: String
    },
    collegeLocation: {
        type: String
    },
    degree: {
        type: String
    },
    skills: {
        typee: String
    },
    certifications: {
        type: String
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    intern: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Intern'
    }
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;