# LLM Crawler

A tool to automatically get answers from multiple LLM platforms for GEO/AEO analysis.

Supported platforms: DeepSeek, Kimi, Doubao (豆包), Yuanbao (元宝), Quark (夸克), Ernie (文心一言)

## Setup

1. Install dependencies: `pnpm i`
2. Install tsx globally: `pnpm add -g tsx`
3. Configure environment variables in `.env.local`
4. (Optional) Set browser path in environment variables

## Available Commands

### Main Operations

- **`pnpm run:db`** - Start the database-driven crawler (RECOMMENDED)
  - Loads keywords from Supabase database
  - Automatically saves answers to database
  - Supports scheduled queries with configurable intervals
  - Use this for production

- **`pnpm run`** - Start the file-based crawler (LEGACY - deprecated)
  - Uses data from `question-list.ts`
  - Saves results to local files
  - Kept for backwards compatibility only

- **`pnpm run login`** - Open all platforms for manual login
  - Opens 7 tabs: IP checker + 6 platforms
  - Wait for you to log in to each platform
  - Sessions are saved automatically for future runs
  - Use this when platform sessions expire
  - Uses iproyal proxy from .env.local

### Queue Management

- **`pnpm run queue`** - Show queue status in terminal
  - Displays pending questions per platform
  - Shows example pending questions

- **`pnpm run queue:web`** - Open web-based queue dashboard
  - Access at http://localhost:8081
  - View detailed metrics and progress
  - Filter by date
  - Expand to see pending and completed questions
  - Auto-refreshes every 30 seconds

### Data Cleaning

- **`pnpm clean:all`** - Clean answers for all platforms
- **`pnpm clean:deepseek`** - Clean DeepSeek answers
- **`pnpm clean:deepseek:legacy`** - Clean legacy DeepSeek answer patterns
- **`pnpm clean:ernie`** - Clean 文心一言 answers
- **`pnpm clean:doubao`** - Clean 豆包 answers
- **`pnpm clean:yuanbao`** - Clean 元宝 answers
- **`pnpm clean:kimi`** - Clean Kimi answers

### Data Management

- **`pnpm reinsert:deepseek`** - Re-insert cleaned DeepSeek answers

## Quick Start

### First Time Setup

1. Install dependencies: `pnpm i`
2. Log in to all platforms: `pnpm run login`
3. Manually log in to each platform in the opened browser tabs
4. Close the browser when done

### Daily Usage

1. Check queue status: `pnpm run queue` or `pnpm run queue:web`
2. Start crawler: `pnpm run:db`
3. Monitor progress on the queue dashboard

## Licence
MIT  
Contact at <https://quanlai.li> for business cooperation.