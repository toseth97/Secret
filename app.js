//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const bcrypt = require("bcrypt");
//const md5 = require("md5");
//stating express app
const app = express();
//const saltRounds = 12;

//Setting up middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
    session({
        secret: "This is not just private, it is a ultmost secret",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true },
    })
);
app.use(passport.initialize());
app.use(passport.session());

//connecting to mongoDB atlas
var uri = "mongodb://127.0.0.1:27017/secretapp";

connectDB().catch((err) => {
    console.log(err.message);
});
async function connectDB() {
    await mongoose.connect(uri).then(console.log("Connect to DB"));
}

const userScheme = new mongoose.Schema({
    email: String,
    password: String,
});

userScheme.plugin(passportLocalMongoose); //using local strategy for authentication
//random string for encryption and decryption of passwords

const User = mongoose.model("user", userScheme);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        (async () => {
            const newUser = new User({
                email: username,
                password: hash,
            });
            await newUser.save();
            res.render("secrets");
        })();
    });

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        (async () => {
            const user = await User.findOne({
                email: username,
            });
            if (user) {
                bcrypt.compare(
                    req.body.password,
                    user.password,
                    async function (err, result) {
                        // result == true
                        if (result === true) {
                            res.render("secrets");
                        } else {
                            res.send("Incorrect Passord");
                        }
                    }
                );
            } else {
                res.send("No such user");
            }
        })();
    });

app.get("/logout", (req, res) => {
    res.redirect("/login");
});

app.get("/secrets", (req, res) => {
    res.render("secrets");
});
//server port
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on ${process.env.PORT || 3000}`);
});
