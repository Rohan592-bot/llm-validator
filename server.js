// server.js
// Entry point — starts the Express server and wires up all the routes.
// Run this with:  node server.js

require("dotenv").config();          // load .env file if it exists
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const schemasRoute = require("./routes/schemas");
const callRoute    = require("./routes/call");
const statsRoute   = require("./routes/stats");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());                     // allow requests from the browser
app.use(express.json());             // parse JSON request bodies

// Serve the HTML frontend from the /public folder
app.use(express.static(path.join(__dirname, "public")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/schemas",  schemasRoute);  // schema registry
app.use("/call",     callRoute);     // validated LLM call
app.use("/",         statsRoute);    // /failures and /metrics

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`   Ollama URL: ${process.env.OLLAMA_URL || "http://localhost:11434"}`);
});