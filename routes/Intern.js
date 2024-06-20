const express = require("express");
const routes = express.Router();
const internController = require("../controllers/intern");

//for company side /applicant to show user who apply for my company
routes.get("/applicants", internController.get_Applicant);

module.exports = routes;