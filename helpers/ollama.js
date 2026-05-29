// helpers/ollama.js
// Two jobs:
//   1. callOllama()   → sends a prompt to the local Ollama server and gets a response
//   2. extractJSON()  → tries to pull valid JSON out of the model's raw text reply

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// ── callOllama ────────────────────────────────────────────────────────────────
// Sends a system prompt + user prompt to Ollama's /api/chat endpoint.
// Returns the response text, how long it took (ms), and token count.

async function callOllama(model, systemPrompt, userPrompt) {
  const startTime = Date.now();

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,           // we want the full response at once, not streamed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    }),
  });

  const data = await response.json();

  return {
    text:    data.message?.content || "",   // the model's reply text
    latency: Date.now() - startTime,        // milliseconds taken
    tokens:  data.eval_count || 0,          // tokens used (if Ollama reports it)
  };
}

// ── extractJSON ───────────────────────────────────────────────────────────────
// Models often wrap their JSON in markdown like:
//   ```json
//   { "name": "Alice" }
//   ```
// This function strips that wrapper and finds the raw JSON object or array.

function extractJSON(text) {
  // Remove markdown code fences like ```json ... ``` or ``` ... ```
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try to find the first {...} or [...] block in the text
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    return JSON.parse(match[1]);
  }

  // If no block found, try parsing the whole cleaned string
  return JSON.parse(cleaned);
}

module.exports = { callOllama, extractJSON };
