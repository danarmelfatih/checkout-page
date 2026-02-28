require('dotenv').config();
console.log(process.env.PORT);


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
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use("/", routes);

// Start Server
app.listen(4000, "127.0.0.1", () => {
    console.log("Server running at http://127.0.0.1:4000");
}); 

// ─── Start Worker ─────────────────────────────────────────────────────────────
const { startWorker } = require("./modules/queue/queue_worker");
startWorker();