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
    }
});

const Company = mongoose.model("Company", companySchema);

companySchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) {
            return next();
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = Company;