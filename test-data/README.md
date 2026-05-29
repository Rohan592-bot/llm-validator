# test-data

Ready-to-use test schemas and prompts for the LLM Validator.

---

## Files

| File | What it contains |
|---|---|
| `schemas.json` | 12 named schemas covering different domains |
| `prompts.json` | 30+ test prompts — easy / medium / hard per schema |
| `seed.js` | Script that auto-registers all schemas in one command |

---

## Quick start

Start the server first:
```bash
node server.js
```

Then in a second terminal, seed all 12 schemas:
```bash
node test-data/seed.js
```

Output:
```
📦 Seeding 12 schemas...

  ✅  movie_review             — A structured movie review with rating and tags
  ✅  person_profile           — Basic personal info of a fictional person
  ✅  product_listing          — An e-commerce product listing
  ✅  book_summary             — A short summary of a book with genre and rating
  ✅  weather_report           — A daily weather report for a city
  ✅  recipe                   — A cooking recipe with ingredients and steps
  ✅  job_posting              — A job listing with role, salary and requirements
  ✅  country_fact             — Key facts about a country
  ✅  fitness_plan             — A weekly fitness plan for a person
  ✅  news_article             — A short news article with headline and category
  ✅  restaurant_review        — A restaurant review with food and service ratings
  ✅  bug_report               — A software bug report with severity and steps

✨ Done! Open http://localhost:3000 → Schemas tab to see them.
```

---

## All 12 schemas

| # | Name | Fields | Domain |
|---|---|---|---|
| 1 | `movie_review` | title, rating, summary, recommended, tags | Entertainment |
| 2 | `person_profile` | name, age, occupation, city, is_student | General |
| 3 | `product_listing` | product_name, price_usd, in_stock, category, features | E-commerce |
| 4 | `book_summary` | title, author, genre, pages, rating, summary | Books |
| 5 | `weather_report` | city, temperature_c, humidity_pct, condition, rain_expected | Weather |
| 6 | `recipe` | name, cuisine, prep_time_min, servings, ingredients, steps | Food |
| 7 | `job_posting` | job_title, company, location, salary range, remote, requirements | Jobs |
| 8 | `country_fact` | country_name, capital, population, area_km2, languages, is_landlocked | Geography |
| 9 | `fitness_plan` | goal, days_per_week, duration_min, exercises, difficulty | Health |
| 10 | `news_article` | headline, category, author, body, breaking | News |
| 11 | `restaurant_review` | restaurant_name, cuisine_type, food_rating, service_rating, price_range, would_return, highlights | Food |
| 12 | `bug_report` | title, severity, component, steps_to_reproduce, expected, actual, reproducible | Software |

---

## Prompt difficulty levels

Every schema has three difficulty levels:

| Level | What it means | What to expect |
|---|---|---|
| **easy** | Clear, specific task directly related to the schema | Passes on attempt 1 |
| **medium** | Vague or conversational phrasing | May trigger the auto-correction retry |
| **hard** | Completely unrelated to the schema | Likely fails all 3 attempts → logged in Failures tab |

Use **hard** prompts to fill up the Failures tab and test failure logging.
Use **medium** prompts to watch the auto-correction kick in.
Use **easy** prompts to confirm everything is working correctly.
