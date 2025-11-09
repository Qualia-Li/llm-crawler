# Scripts

This folder contains utility scripts for the llm-crawler project.

## Available Scripts

### 1. `count_keywords.js`
**Purpose:** Analyzes `data/result.json` to count unique extended keywords with answers.

**Usage:**
```bash
node scripts/count_keywords.js
```

**Output:**
- Total count of extended keywords with answers
- Detailed breakdown showing:
  - Each extended keyword
  - Number of answers per keyword
  - Which AI engines provided answers

### 2. `insert_answers_batch.ts`
**Purpose:** Imports all answers from `data/result.json` into the Supabase `answers` table.

**Usage:**
```bash
npx tsx scripts/insert_answers_batch.ts
```

**Features:**
- Looks up `keyword_id` from the `keywords` table for each core keyword
- Inserts answers for both core keywords and extended keywords
- Handles multiple AI platforms (deepseek, 豆包, 元宝, 文心一言, 夸克, kimi)
- Skips duplicates automatically
- Uses database transactions for data integrity
- Provides detailed progress reporting

**Requirements:**
- PostgreSQL connection configured in `.env.local`
- Either `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` OR `DATABASE_URL` must be set

## Notes

- All scripts expect to be run from the project root directory
- Make sure `data/result.json` exists before running these scripts
