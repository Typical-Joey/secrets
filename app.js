require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy;

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Setting up express-session
app.use(session({
    secret: process.env.SECRET,
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
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// Setting up Google OAuth 2.0
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_SECRET_ID,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

// Setting up facebook OAuth 2.0
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_SECRET_ID,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            facebookId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));



///// Home Page Route ////////////////////////////////////////
app.route("/")
    .get(function (req, res) {
        res.render("home");
    });

///// Google OAuth ////////////////////////////////////////
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

///// Facebook OAuth ////////////////////////////////////////
app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
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
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
                res.redirect("/login");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })
            }
        });
    });


///// Secrets Route ////////////////////////////////////////////
app.route("/secrets")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.redirect("/login");
        }
    });

///// Logout Route ////////////////////////////////////////////
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


app.listen(process.env.PORT || 3000, function () {
    console.log("Server is now listening");
});