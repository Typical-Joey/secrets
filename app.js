require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // Hash module
const saltRounds = 10;

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
        }, function (err, foundUser) {
            if (!err) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        res.render("secrets");
                    } else if (result === false) {
                        res.send("Incorrect login");
                    }
                });
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

        // Hash password
        bcrypt.hash(password, saltRounds, function (err, hash) {
            const newUser = new User({
                email: email,
                password: hash
            });
            User.findOne({
                email: newUser.email
            }, function (err, foundUser) {
                if (!err && !foundUser) {
                    newUser.save(function (err) {
                        if (!err) {
                            res.render("secrets");
                        } else {
                            res.send(err);
                        }
                    });
                } else if (!err && foundUser) {
                    res.send("User Already Exists");
                } else {
                    res.send(err);
                }
            });
        });
    });


app.listen(process.env.PORT || 3000, function () {
    console.log("Server is now listening");
});