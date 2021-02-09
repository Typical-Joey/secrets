const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

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

const userSchema = {
    email: String,
    password: String
};

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
                res.redirect("/login");
            } else {
                console.log(err);
            }
        });


    });


app.listen(process.env.PORT || 3000, function () {
    console.log("Server is now listening");
});