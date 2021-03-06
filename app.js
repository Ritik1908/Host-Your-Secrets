//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport");
const passportLocalMoongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(session({
	secret: "I am Ritik Verma.",
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	secret: String
});

userSchema.plugin(passportLocalMoongoose);

const User = new mongoose.model("user", userSchema)

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.get("/", function(req, res){
	res.render("home");
});

app.get("/login", function(req, res){
	res.render("login");
});

app.post("/login", function(req, res){
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user, function(err){
		if(err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req,res, function(){
				res.redirect("/secrets");
			});
		}
	})
});

app.get("/register", function(req, res){
	res.render("register");
});

app.get("/secrets", function(req, res){
	User.find({"secret": {$ne: null}}, function(err, foundUser){
		if(err) {
			console.log(err);
		} else {
			if(foundUser) {
				res.render("secrets", {usersWithSecrets: foundUser});
			}
		}
	})
})

app.post("/register", function(req, res){
	User.register({username: req.body.username}, req.body.password, function(err, user){
		if(err) {
			console.log(err);
			res.redirect("/login");
		} else {
			passport.authenticate("local")(req,res, function(){
				res.redirect("/secrets");
			});
		}
	});
});

app.get("/submit", function(req, res) {
	if(req.isAuthenticated()) {
		res.render("submit");
	} else {
		res.redirect("login");
	}
});

app.post("/submit", function(req, res) {
	const submittedSecret = req.body.secret;
	User.findById(req.user.id, function(err, foundUser){
		if(err){
			console.log();
		} else {
			if(foundUser) {
				foundUser.secret = submittedSecret;
				foundUser.save(function(){
					res.redirect("/secrets");
				});
			}
		}
	})
});

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
});

app.listen(3000, function(){
	console.log("Server started on port 3000");
});