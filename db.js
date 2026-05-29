// db.js
// Sets up a local SQLite database with 3 tables:
//   schemas  → stores the named schemas users register
//   failures → logs every call that failed all 3 attempts
//   calls    → logs every call result for metrics

const Database = require("better-sqlite3");

// Creates (or opens) a file called validator.db in the project folder
const db = new Database("validator.db");

// Create tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS schemas (
    name        TEXT PRIMARY KEY,
    definition  TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS failures (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    schema_name TEXT,
    prompt      TEXT,
    model       TEXT,
    attempts    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS calls (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    schema_name   TEXT,
    strategy      TEXT,
    success       INTEGER,
    attempt_count INTEGER,
    latency_ms    INTEGER,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;