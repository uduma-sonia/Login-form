if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

//SETTING LOCAL VARIABLES TO STORE USERS INSTEAD OF DATA BASE
const users = [];

app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/img", express.static(__dirname + "public/img"));
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { user: req.user.name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    //THE PAGE IT GOES TO IF LOGIN IS SUCCESSFUL
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

//APP FOR REGISTERING USERS
app.post("/register", checkNotAuthenticated, async (req, res) => {
  //MAKE A HASHED PASSWORD FOR SECURITY
  try {
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashPassword,
    });
    //TO REDIRECT THEM BACK TO THE LOGIN PAGE AFTER REGISTERING
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

//FUNCTION TO LOG USER OUT
app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});

//FUNCTION TO CHECK IF USER IS NOT LOGGED ON AT FIRST
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

//FUNCTION TO NOT ALLOW USER GO BACK TO LOGIN PAGE AFTER LOGGED IN
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(3000);

//USE "EXPRESS-FLASH" TO DISPLAY MESSAGES WHEN WE LOGIN
