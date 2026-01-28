const express = require("express");
const path = require("path");
const app = express();
const routes = require("./routes");

app.use("/", routes);

app.listen(4000, "127.0.0.1", () => {
    console.log("Server running at http://127.0.0.1:4000");
});