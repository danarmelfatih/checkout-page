require('dotenv').config();
const express = require("express");
const path = require("path");
const session = require("express-session"); // ← TAMBAH INI

const app = express();

// Body parser (WAJIB untuk baca req.body dari form)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware ← TAMBAH BLOK INI
app.use(session({
    secret: 'rahasia-checkout-app-2024', // ganti dengan string random
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // ganti true jika pakai HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 jam
    }
}));

// set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "modules"));

// static assets
app.use(express.static(path.join(__dirname, "assets")));
app.use(
    "/assets",
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Cache-Control", "public, max-age=86400");
        next();
    },
    express.static(path.join(__dirname, "assets"))
);

// routes
const routes = require("./routes");
app.use("/", routes);

// server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});