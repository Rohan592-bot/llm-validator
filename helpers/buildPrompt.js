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

  return `You are a helpful assistant. Respond ONLY with valid JSON.\nSchema:\n${schemaStr}`;
}

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
