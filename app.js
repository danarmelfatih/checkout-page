const express = require("express");
const path = require("path");

const app = express();

// set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "modules"));

// static assets
app.use(express.static(path.join(__dirname, "assets")));

// routes
const routes = require("./routes");
app.use("/", routes);

// server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

app.set("view engine", "ejs");

app.use(
    "/assets",
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Cache-Control", "public, max-age=86400");
        next();
    },
    express.static(path.join(__dirname, "assets"))
)