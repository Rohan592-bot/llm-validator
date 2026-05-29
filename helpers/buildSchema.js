// helpers/buildSchema.js
// Converts a plain JSON definition object into a Zod validator.
//
// Why? We store schemas as plain JSON in the database.
// This file turns that JSON back into a real Zod schema we can use to validate.
//
// Example input:
//   { type: "object", fields: { name: { type: "string", min: 2 }, age: { type: "number" } } }
//
// Example output:
//   z.object({ name: z.string().min(2), age: z.number() })

const { z } = require("zod");

function buildZodSchema(def) {

  // ── Object: has named fields ─────────────────────────────
  if (def.type === "object" && def.fields) {
    const shape = {};
    for (const [key, value] of Object.entries(def.fields)) {
      shape[key] = buildZodSchema(value); // recursively handle nested fields
    }
    return z.object(shape);
  }

  // ── Array: a list of items of the same type ──────────────
  if (def.type === "array" && def.items) {
    return z.array(buildZodSchema(def.items));
  }

  // ── String ───────────────────────────────────────────────
  if (def.type === "string") {
    if (def.enum) return z.enum(def.enum);   // e.g. ["red","green","blue"]
    let s = z.string();
    if (def.min) s = s.min(def.min);         // minimum length
    if (def.max) s = s.max(def.max);         // maximum length
    if (def.optional) s = s.optional();
    return s;
  }

  // ── Number ───────────────────────────────────────────────
  if (def.type === "number") {
    let n = z.number();
    if (def.min !== undefined) n = n.min(def.min);
    if (def.max !== undefined) n = n.max(def.max);
    if (def.optional) n = n.optional();
    return n;
  }

  // ── Boolean ──────────────────────────────────────────────
  if (def.type === "boolean") {
    return def.optional ? z.boolean().optional() : z.boolean();
  }

  // ── Enum (standalone) ────────────────────────────────────
  if (def.type === "enum") {
    return z.enum(def.values);
  }

  // ── Fallback: accept anything ────────────────────────────
  return z.any();
}

module.exports = { buildZodSchema };