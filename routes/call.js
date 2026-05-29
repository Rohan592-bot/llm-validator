// routes/call.js
// The core of the project — POST /call
//
// Flow:
//   1. Look up the schema by name
//   2. Build a system prompt based on the chosen strategy
//   3. Call Ollama with the user's prompt
//   4. Try to parse + validate the response with Zod
//   5. If it fails → send a correction prompt and retry (up to 3 attempts total)
//   6. Return the result (success or structured failure)

const express = require("express");
const router  = express.Router();
const db      = require("../db");

const { buildZodSchema }                         = require("../helpers/buildSchema");
const { buildSystemPrompt, buildCorrectionPrompt } = require("../helpers/buildPrompt");
const { callOllama, extractJSON }                = require("../helpers/ollama");

const MAX_ATTEMPTS = 3;

router.post("/", async (req, res) => {
  const schema_name = req.body.schema_name;
  const prompt = req.body.prompt;
  const model = req.body.model;
  let strategy = req.body.strategy;

  if (strategy === undefined) {
    strategy = "json_instruction";
  }

  // ── Validate request ──────────────────────────────────────
  if (schema_name === undefined || prompt === undefined || schema_name === "" || prompt === "") {
    return res.status(400).json({ error: "'schema_name' and 'prompt' are required." });
  }

  // ── Load schema from database ─────────────────────────────
  const selectSql = "SELECT definition FROM schemas WHERE name = ?";
  const selectStatement = db.prepare(selectSql);
  const schemaRow = selectStatement.get(schema_name);

  if (schemaRow === undefined) {
    return res.status(404).json({ error: `Schema '${schema_name}' not found.` });
  }

  const definition = JSON.parse(schemaRow.definition);
  const zodSchema = buildZodSchema(definition); // the Zod validator
  
  let usedModel = "llama3";
  if (model !== undefined && model !== "") {
    usedModel = model;
  } else if (process.env.DEFAULT_MODEL !== undefined && process.env.DEFAULT_MODEL !== "") {
    usedModel = process.env.DEFAULT_MODEL;
  }

  // ── Tracking variables ────────────────────────────────────
  const attempts = []; // stores each attempt's details
  let totalLatency = 0;
  let totalTokens = 0;
  let success = false;
  let validatedOutput = null;

  // First attempt uses the normal strategy prompt.
  // Later attempts use a correction prompt that explains what went wrong.
  let systemPrompt = buildSystemPrompt(strategy, definition);
  let currentPrompt = prompt;

  // ── Retry loop (up to 3 attempts) ────────────────────────
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const attemptNumber = i + 1;

    // Step 1: Call Ollama
    const ollamaResult = await callOllama(usedModel, systemPrompt, currentPrompt);
    const text = ollamaResult.text;
    const latency = ollamaResult.latency;
    const tokens = ollamaResult.tokens;

    totalLatency = totalLatency + latency;
    totalTokens = totalTokens + tokens;

    let parsed = null;
    let parseError = null;
    let validationError = null;

    // Step 2: Try to extract JSON from the response
    try {
      parsed = extractJSON(text);
    } catch (e) {
      parseError = "Could not parse JSON: " + e.message;
    }

    // Step 3: If we got valid JSON, validate it against the schema
    if (parsed !== null) {
      const result = zodSchema.safeParse(parsed);

      if (result.success === true) {
        // ✅ Passed! Save it and stop retrying.
        validatedOutput = result.data;
        success = true;
        
        attempts.push({
          attempt: attemptNumber,
          raw: text,
          parsed: parsed,
          error: null
        });
        break;
      } else {
        // ❌ Failed Zod validation — format the error messages using a basic for loop
        const errorsList = [];
        const issues = result.error.issues;
        
        for (let j = 0; j < issues.length; j++) {
          const issue = issues[j];
          let path = issue.path.join(".");
          if (path === "") {
            path = "root";
          }
          errorsList.push(path + ": " + issue.message);
        }
        
        validationError = errorsList.join("; ");
      }
    }

    // Step 4: Record the failed attempt
    let errorMessage = "Unknown error";
    if (parseError !== null) {
      errorMessage = parseError;
    } else if (validationError !== null) {
      errorMessage = validationError;
    }

    attempts.push({
      attempt: attemptNumber,
      raw: text,
      parsed: parsed,
      error: errorMessage
    });

    // Step 5: Build a correction prompt for the next attempt
    // (No point building one after the last attempt)
    if (i < MAX_ATTEMPTS - 1) {
      systemPrompt = buildCorrectionPrompt(definition, errorMessage);
      currentPrompt = "Try again. Original task: " + prompt;
    }
  }

  // ── Log to database ───────────────────────────────────────
  const insertCallsSql = `
    INSERT INTO calls (schema_name, strategy, success, attempt_count, latency_ms)
    VALUES (?, ?, ?, ?, ?)
  `;
  const insertCallsStatement = db.prepare(insertCallsSql);
  
  let successInteger = 0;
  if (success === true) {
    successInteger = 1;
  }
  
  insertCallsStatement.run(schema_name, strategy, successInteger, attempts.length, totalLatency);

  // If all attempts failed, also log to the failures table
  if (success === false) {
    const insertFailuresSql = `
      INSERT INTO failures (schema_name, prompt, model, attempts)
      VALUES (?, ?, ?, ?)
    `;
    const insertFailuresStatement = db.prepare(insertFailuresSql);
    insertFailuresStatement.run(schema_name, prompt, usedModel, JSON.stringify(attempts));

    return res.status(422).json({
      success: false,
      error: "All " + MAX_ATTEMPTS + " attempts failed validation.",
      attempts: attempts,
      total_latency_ms: totalLatency,
      total_tokens: totalTokens
    });
  }

  // ── Return success ────────────────────────────────────────
  let correctionNeeded = false;
  if (attempts.length > 1) {
    correctionNeeded = true;
  }

  res.json({
    success: true,
    output: validatedOutput,
    attempt_count: attempts.length,
    correction_needed: correctionNeeded,
    total_latency_ms: totalLatency,
    total_tokens: totalTokens,
    attempts: attempts
  });
});

module.exports = router;