// routes/schemas.js
// Handles everything related to the schema registry:
//   POST   /schemas       → register a new schema
//   GET    /schemas       → list all schemas
//   DELETE /schemas/:name → delete a schema by name

const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ── POST /schemas ─────────────────────────────────────────────────────────────
// Body: { name: "product_review", definition: { type: "object", fields: {...} } }
// Saves the schema to the database so it can be reused across calls.

router.post("/", (req, res) => {
  const name = req.body.name;
  const definition = req.body.definition;

  if (name === undefined || name === "" || definition === undefined) {
    return res.status(400).json({ error: "Both 'name' and 'definition' are required." });
  }

  try {
    // If the schema name already exists, this statement will replace it (update it)
    const sql = "INSERT OR REPLACE INTO schemas (name, definition) VALUES (?, ?)";
    const statement = db.prepare(sql);
    statement.run(name, JSON.stringify(definition));

    res.json({ ok: true, name: name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /schemas ──────────────────────────────────────────────────────────────
// Returns all registered schemas as a list.

router.get("/", (req, res) => {
  const sql = "SELECT name, definition, created_at FROM schemas";
  const statement = db.prepare(sql);
  const rows = statement.all();

  // Create a clean list and fill it manually using a basic for-loop
  const schemasList = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsedDefinition = JSON.parse(row.definition);
    
    // Explicitly push a clean object to the list
    schemasList.push({
      name: row.name,
      definition: parsedDefinition,
      created_at: row.created_at
    });
  }

  res.json(schemasList);
});

// ── DELETE /schemas/:name ─────────────────────────────────────────────────────
// Removes a schema by name.

router.delete("/:name", (req, res) => {
  const schemaName = req.params.name;
  const sql = "DELETE FROM schemas WHERE name = ?";
  const statement = db.prepare(sql);
  statement.run(schemaName);
  
  res.json({ ok: true });
});

module.exports = router;