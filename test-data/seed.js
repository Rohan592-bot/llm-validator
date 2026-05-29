// test-data/seed.js
// Automatically registers all schemas from schemas.json into the running server.
//
// Usage:
//   Step 1 — start the server:   node server.js
//   Step 2 — run this script:    node test-data/seed.js

const schemas = require('./schemas.json');

const API = 'http://localhost:3000';

async function seedSchemas() {
  console.log(`\n📦 Seeding ${schemas.length} schemas...\n`);

  for (const schema of schemas) {
    try {
      const res = await fetch(`${API}/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       schema.name,
          definition: schema.definition,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        console.log(`  ✅  ${schema.name.padEnd(25)} — ${schema.description}`);
      } else {
        console.log(`  ❌  ${schema.name.padEnd(25)} — ${data.error}`);
      }
    } catch (err) {
      console.log(`  ❌  ${schema.name.padEnd(25)} — ${err.message}`);
    }
  }

  console.log('\n✨ Done! Open http://localhost:3000 → Schemas tab to see them.\n');
}

seedSchemas();
