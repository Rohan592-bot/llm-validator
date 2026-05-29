// helpers/buildPrompt.js
// Two jobs:
//   1. buildSystemPrompt() → creates the system prompt we send to Ollama
//   2. buildExample()      → creates a fake filled-in example from a schema definition

// ── buildExample ─────────────────────────────────────────────────────────────
// Recursively creates a simple example value from a schema definition.
// Used by the "few_shot" strategy to show the model what the output should look like.
//
// Example input:  { type: "object", fields: { name: { type: "string" }, score: { type: "number", min: 1 } } }
// Example output: { name: "example", score: 1 }

function buildExample(def) {
  if (def.type === "object" && def.fields) {
    const obj = {};
    for (const [key, value] of Object.entries(def.fields)) {
      obj[key] = buildExample(value);
    }
    return obj;
  }
  if (def.type === "array")   return [buildExample(def.items)];
  if (def.type === "string")  return def.enum ? def.enum[0] : "example string";
  if (def.type === "number")  return def.min ?? 42;
  if (def.type === "boolean") return true;
  if (def.type === "enum")    return def.values[0];
  return null;
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────────
// Three strategies for telling the model what format to return:
//
//   "json_instruction" → just tells the model what schema to follow (simple, direct)
//   "few_shot"         → shows the model a filled example (helps when the model struggles)
//   default            → same as json_instruction as a fallback

function buildSystemPrompt(strategy, definition) {
  const schemaStr = JSON.stringify(definition, null, 2);

  if (strategy === "json_instruction") {
    return [
      "You are a helpful assistant.",
      "Respond ONLY with valid JSON matching this schema:",
      schemaStr,
      "Do not include any explanation, markdown, or code blocks.",
      "Return raw JSON only.",
    ].join("\n");
  }

  if (strategy === "few_shot") {
    const example = buildExample(definition);
    return [
      "You are a helpful assistant.",
      "Return only valid JSON. Here is an example of the exact format expected:",
      JSON.stringify(example, null, 2),
      "Follow this structure exactly. Return raw JSON only, no explanation.",
    ].join("\n");
  }

  // Default fallback
  return `You are a helpful assistant. Respond ONLY with valid JSON.\nSchema:\n${schemaStr}`;
}

// ── buildCorrectionPrompt ─────────────────────────────────────────────────────
// When a response fails validation, we send this on the next attempt.
// It tells the model exactly what went wrong and asks it to try again.

function buildCorrectionPrompt(definition, error) {
  return [
    "Your previous response failed validation with this error:",
    error,
    "",
    "The expected schema is:",
    JSON.stringify(definition, null, 2),
    "",
    "Please try again and return ONLY valid JSON. No explanation. No markdown.",
  ].join("\n");
}

module.exports = { buildSystemPrompt, buildCorrectionPrompt, buildExample };
