const express = require("express");
const routes = express.Router();
const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });
const companyController = require("../controllers/company")


routes.get("/company", companyController.Company);

// click arrow to show more details for company 
routes.get("/:id/company", companyController.getIdCompany)

// For profile images
routes.get("/profile/:id", companyController.showProfile);

// get form for editing 
routes.get("/edit/:id", companyController.getEdit);

// put request for editing 
routes.put("/:id/edit", upload.single('photos'), companyController.putEdit);



//for apply form
routes.get("/:id/apply", companyController.apply_Form)

routes.post("/:id/apply", companyController.post_Form);


module.exports = routes;