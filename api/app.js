const express = require("express");
const cors = require("cors");
const app = express();
const routes = require("./routes");

// CORS Configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", routes);

// Start Server
app.listen(4000, "127.0.0.1", () => {
    console.log("Server running at http://127.0.0.1:4000");
});