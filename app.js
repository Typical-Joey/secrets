require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Setting up express-session
app.use(session({
    secret: "Some long dumb string.",
    resave: false,
    saveUninitialized: false
}));

// Setting up passport
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});
mongoose.set("useCreateIndex", true);

// When using passport, schema MUST INCLUDE username FIELD EVEN WHEN USING AN EMAIL
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

///// Home Page Route ////////////////////////////////////////
app.route("/")
    .get(function (req, res) {
        res.render("home");
    });

///// Register Route ////////////////////////////////////////
app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })

    // Add new user to database
    .post(function (req, res) {

        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })
            }
        });

    });


///// Login Route ////////////////////////////////////////////
app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })

    // User Login
    .post();


///// Secrets Route ////////////////////////////////////////////
app.route("/secrets")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.redirect("/login");
        }
    });


app.listen(process.env.PORT || 3000, function () {
    console.log("Server is now listening");
});