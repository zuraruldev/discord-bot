# Discord Bot

A personal Discord bot for quiz games, aliases lookup, and market tracking.

## Features

- **Quiz Games**: Flag, Capital, US States, Indonesian Kabupatens, Provinces, Languages
- **Aliases Lookup**: View correct answers for quiz questions
- **Calculator**: Auto-responds to math expressions
- **Idle Tracking**: Monitors Idle Farm market and inventory (JSON-based storage)

## Installation

### Prerequisites
- Node.js 18+
- A Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/zuraruldev/discord-bot.git
cd discord-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the root directory:
```
TOKEN=your_discord_bot_token_here
ERROR_LOG_CHANNEL_ID=your_error_log_channel_id_here
```

4. Build the bot:
```bash
npm run build
```

5. Start the bot:
```bash
npm start
```

## Usage

### Commands
- `geo help` - Show all available commands
- `geo help <command>` - Get help for a specific command
- `geo flag` - Start a flag guessing game
- `geo capital` - Start a capital guessing game
- `geo united-states` - Guess US states
- `geo kabupaten` - Guess Indonesian kabupatens
- `geo province` - Guess Indonesian provinces
- `geo language` - Guess languages from sentences
- `geo aliases <category> [page]` - View answer aliases

### Quiz Games
- Each quiz has a 30-second timer
- Answer directly in chat to submit
- Instant feedback (right/wrong)
- No scoring or database storage

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Tech Stack
- **Framework**: oceanic.js (Discord API)
- **Language**: TypeScript
- **Build**: esbuild
- **Linter**: ESLint
- **Database**: JSON files (for idle tracking)

## Personal Use

This bot is for personal use. Feel free to modify and adapt it to your needs.

## License

MIT
