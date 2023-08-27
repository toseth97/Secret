require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
//const bcrypt = require("bcrypt");
const app = express();
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require("mongoose-findorcreate");

//middle ware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

//const saltRound = 12;

connectDB();
async function connectDB() {
    await mongoose
        .connect("mongodb://127.0.0.1:27017/authtest")
        .then(console.log("Connected to DB"));
}

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.APP_ID,
            clientSecret: process.env.APP_SECRET,
            callbackURL: "http://localhost:8080/auth/facebook/secret",
            profileFields: ["id", "displayName", "email"],
        },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile);
            User.findOrCreate({ facebookId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    )
);

app.get("/", (req, res) => {
    res.render("home");
});

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post(async (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.register(
            new User({ username: username }),
            password,
            async (err, user) => {
                if (err) {
                    console.log(err.message);
                    res.render("register");
                } else {
                    // passport.authenticate("local", (req, res) => {
                    //     res.redirect("/secret");
                    // });
                    const authenticate = User.authenticate("local");
                    authenticate(username, password, (err, result) => {
                        res.redirect("/secret");
                    });
                }
            }
        );
    });

app.get(
    "/auth/facebook",
    passport.authenticate("facebook", { scope: ["profile"] })
);

app.get(
    "/auth/facebook/secret",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secret");
    }
);

app.get("/secret", async (req, res) => {
    console.log(req.isAuthenticated);
    if (req.isAuthenticated()) {
        res.render("secret");
    } else {
        res.redirect("/login");
    }
});

app.route("/login").get((req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/secret");
    } else {
        res.render("login");
    }
});
// .post(async (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;
// });

app.get("/logout", async (req, res) => {
    req.logout((err, result) => {
        if (!err) {
            req.isAuthenticated = false;
            res.redirect("/login");
        }
    });
});

app.listen(8080, () => {
    console.log("server started");
});
