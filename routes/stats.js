// routes/stats.js
// Two read-only endpoints for monitoring:
//   GET /failures → recent calls that failed all 3 attempts
//   GET /metrics  → pass rates by schema + strategy combo

const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ── GET /failures ─────────────────────────────────────────────────────────────
// Returns the 50 most recent failures.
// Each failure includes the schema name, prompt, model used, and all attempt details.

router.get("/failures", (req, res) => {
  const sql = "SELECT id, schema_name, prompt, model, attempts, created_at FROM failures ORDER BY created_at DESC LIMIT 50";
  const statement = db.prepare(sql);
  const rows = statement.all();

  // Map the database rows to objects using a basic for loop
  const failuresList = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsedAttempts = JSON.parse(row.attempts);

    failuresList.push({
      id: row.id,
      schema_name: row.schema_name,
      prompt: row.prompt,
      model: row.model,
      attempts: parsedAttempts,
      created_at: row.created_at
    });
  }

  res.json(failuresList);
});

// ── GET /metrics ──────────────────────────────────────────────────────────────
// Groups all calls by schema name + strategy and calculates totals.

router.get("/metrics", (req, res) => {
  const sql = `
    SELECT
      schema_name,
      strategy,
      COUNT(*)              AS total,
      SUM(success)          AS passed,
      AVG(attempt_count)    AS avg_attempts,
      AVG(latency_ms)       AS avg_latency
    FROM calls
    GROUP BY schema_name, strategy
    ORDER BY total DESC
  `;
  const statement = db.prepare(sql);
  const rows = statement.all();

  res.json(rows);
});

module.exports = router;