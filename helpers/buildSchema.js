const { z } = require("zod");

function buildZodSchema(def) {

  if (def.type === "object" && def.fields) {
    const shape = {};
    for (const [key, value] of Object.entries(def.fields)) {
      shape[key] = buildZodSchema(value);
    }
    return z.object(shape);
  }

  if (def.type === "array" && def.items) {
    return z.array(buildZodSchema(def.items));
  }

  if (def.type === "string") {
    if (def.enum) return z.enum(def.enum);
    let s = z.string();
    if (def.min) s = s.min(def.min);
    if (def.max) s = s.max(def.max);
    if (def.optional) s = s.optional();
    return s;
  }

  if (def.type === "number") {
    let n = z.number();
    if (def.min !== undefined) n = n.min(def.min);
    if (def.max !== undefined) n = n.max(def.max);
    if (def.optional) n = n.optional();
    return n;
  }

  if (def.type === "boolean") {
    return def.optional ? z.boolean().optional() : z.boolean();
  }

  if (def.type === "enum") {
    return z.enum(def.values);
  }

  return z.any();
}

module.exports = { buildZodSchema };
