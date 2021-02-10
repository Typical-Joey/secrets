const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Encrypt passwords
const secret = "Thisisourlittlesecret.";
userSchema.plugin(encrypt, {
    secret: secret,
    encryptedFields: ["password"]
});

const User = mongoose.model("User", userSchema);

///// Home Page Route ////////////////////////////////////////
app.route("/")
    .get(function (req, res) {
        res.render("home");
    });

///// Login Route ///////////////////////////////////////////
app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })

    // User Login
    .post(function (req, res) {
        const email = req.body.email;
        const password = req.body.password;

        User.findOne({
            email: email,
        }, function (err, user) {
            if (!err) {
                if (user && user.password === password) {
                    res.render("secrets");
                } else {
                    res.send("Username or Password was incorrect");
                }
            } else {
                res.send(err);
            }
        });
    });

///// Register Route ////////////////////////////////////////
app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })

    // Add new user to database
    .post(function (req, res) {
        const email = req.body.email;
        const password = req.body.password;

        const newUser = new User({
            email: email,
            password: password
        });
        newUser.save(function (err) {
            if (!err) {
                console.log("Successfully added user");
                res.render("secrets");
            } else {
                console.log(err);
            }
        });


    });


app.listen(process.env.PORT || 3000, function () {
    console.log("Server is now listening");
});