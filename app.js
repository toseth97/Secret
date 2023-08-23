//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const encrypt = require("mongoose-encryption");
//stating express app
const app = express();

//Setting up middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
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

//random string for encryption and decryption of passwords

userScheme.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"],
});

const User = mongoose.model("user", userScheme);

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
                password: password,
            });
            await newUser.save();
            console.log(newUser);
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
                if (user.password === password) {
                    res.render("secrets");
                } else {
                    res.send("Incorrect Passord");
                }
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
