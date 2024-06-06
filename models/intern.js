const mongoose = require("mongoose");

const internSchema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    photos: {
        type: String
    },
    mobilenumber: {
        type: Number
    },
    education: {
       type: String 
    },
    experience: {
        type: String
    }
})

const Intern = mongoose.model("Intern", internSchema);

module.exports = Intern;