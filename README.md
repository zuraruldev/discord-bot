# Discord Bot (fx)

A multifunctional Discord bot written in TypeScript and Oceanic.js, featuring interactive geography and Wordle games, an AI chatbot companion (Alya-san), an automated university class reminder system, live VPS and bot system monitoring, and a virtual Linux-style vault filesystem.

---

## Features

### 1. Alya AI Chatbot Companion
- **Character**: Alisa Mikhailovna Kujou (Alya-san) from *Alya Sometimes Hides Her Feelings in Russian*.
- **Persona & Tone**: Witty, elegant, smart, playful, and expressive with emojis. Communicates fluently in Indonesian, English, and Russian.
- **Provider**: Powered by local 9router AI or any OpenAI-compatible API (`AI_API_BASE`, `AI_API_KEY`, `AI_MODEL`).
- **Dedicated Channel**: Restricted to a designated channel (`CHAT_CHANNEL_ID`) to keep other server channels clean.
- **Context-Aware**:
  - Live university schedule and current day/time awareness (WIB / `Asia/Jakarta`).
  - Bot codebase knowledge directly loaded from project documentation.
  - Husband recognition for user `<@910785829549539338>`.
- **Server Security & Admin Authority**:
  - Even with Discord Administrator permissions, Alya strictly rejects any kick, ban, timeout, or role manipulation requests from regular users.
  - Moderation and role management requests are exclusively reserved for verified Server Admins.

### 2. Class Schedule & Automated 5:00 AM Reminder
- **Automated Scheduler**: Dispatches daily class schedules at 5:00 AM (Monday – Friday, WIB) to the configured reminder channel.
- **Weekend Awareness**: Automatically skips weekends (Saturday & Sunday).
- **User Commands**:
  - `fx matkul` - View today's class schedule.
  - `fx matkul <hari>` - View class schedule for a specific day (e.g. `fx matkul senin`).
  - `fx matkul list` - View the complete weekly schedule (Monday to Friday).
- **Admin Management**:
  - `fx matkul add <hari> <waktu> <ruang> <nama_matkul>` - Add a subject (max 3 subjects per day).
  - `fx matkul remove <hari> <index>` - Remove a subject by index.
  - `fx matkul clear <hari>` - Clear all subjects for a specific day.
  - `fx matkul setchannel [channelId]` - Change destination channel for schedule reminders.
  - `fx matkul send [hari]` - Force dispatch a reminder to Discord immediately.

### 3. Server & Bot Live Monitoring
- **Live Updating Embed**: Automatically updates every 60 seconds with:
  - VPS Hostname, OS platform, and architecture.
  - System uptime and bot process uptime.
  - Discord Gateway WebSocket latency.
  - Memory (RAM) usage (Used / Total and percentage).
  - CPU model and 1m, 5m, 15m load averages.
  - Disk space usage (Used / Total GB and percentage).
- **Graceful Shutdown Status**: Hooks into `SIGINT` and `SIGTERM` signals to update status to `[OFFLINE]` with timestamp before process exit.
- **Threshold Alerts**: Automatically sends alert embeds to the error log channel when RAM or Disk usage reaches 90% or higher.
- **Admin Commands**:
  - `fx status` - View current monitoring stats embed.
  - `fx status setchannel [channelId]` - Set the monitoring channel.
  - `fx status refresh` - Force an immediate status embed refresh.

### 4. Linux-Style Vault Filesystem
- **Virtual Filesystem**: Hierarchical folder and file structure stored persistently in `data/vault.json`.
- **Commands**:
  - `fx vault ls [path]` - List files and directories.
  - `fx vault cat <path>` - Read file contents.
  - `fx vault write <path> <content...>` - Write or overwrite a file.
  - `fx vault touch <path>` - Create an empty file.
  - `fx vault mkdir <path>` - Create a directory.
  - `fx vault rm <path>` - Remove a file or empty directory.
  - `fx vault stat <path>` - View file/directory metadata.

### 5. Quiz & Wordle Games
- **Geography Quizzes**:
  - `fx flag` - Guess countries from flag images.
  - `fx capital` - Guess country capitals.
  - `fx kabupaten` - Guess Indonesian regencies / cities.
  - `fx province` - Guess Indonesian provinces.
  - `fx united-states` - Guess US states.
  - `fx language` - Guess languages from text samples.
  - `fx aliases <category> [page]` - Search answer aliases.
- **Wordle & Katla**:
  - `fx wordy` - English 5-letter Wordle game.
  - `fx katla` - Indonesian 5-letter Wordle game.
  - `fx show` - View current game board.
  - `fx surrender` - Forfeit the current match.
  - `fx stats` - View personal gameplay statistics.
  - `fx colorblind` - Toggle high-contrast colorblind mode.

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Discord Bot Token with Message Content and Server Members intents enabled

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/zuraruldev/discord-bot.git
cd discord-bot
npm install
```

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
# Discord Bot Token
TOKEN=your_discord_bot_token_here

# Prefix (default: fx)
PREFIX=fx

# Bug & Error Logging Channel ID
ERROR_LOG_CHANNEL_ID=1548643055614165092
BUG_CHANNEL_ID=1548643055614165092

# Matkul / Class Reminder Channel ID
MATKUL_CHANNEL_ID=1548318224636977233
REMINDER_CHANNEL_ID=1548318224636977233

# Server & Bot Live Status Monitoring Channel ID
STATUS_CHANNEL_ID=1548338205928202321
MONITORING_CHANNEL_ID=1548338205928202321

# Admin User IDs (comma-separated)
ADMIN_USER_IDS=1256220010859466795,910785829549539338

# AI Chatbot (9router or OpenAI-compatible)
AI_API_BASE=http://localhost:20128/v1
AI_API_KEY=your_api_key_here
AI_MODEL=ag/gemini-3.8-flash-low
CHAT_CHANNEL_ID=1555508577945522206
```

### 3. Build & Run
```bash
# Build TypeScript with esbuild
npm run build

# Start bot process
npm start
```

### 4. Code Quality & Linting
```bash
# Run ESLint checks
npm run lint
```

---

## VPS Deployment (Systemd)

To run the bot as a background service with auto-restart on a Linux VPS:

```ini
# /etc/systemd/system/discord-bot.service
[Unit]
Description=Discord Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/discord-bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
EnvironmentFile=/root/discord-bot/.env

[Install]
WantedBy=multi-user.target
```

Reload systemd and start the service:
```bash
systemctl daemon-reload
systemctl enable --now discord-bot
systemctl status discord-bot
```

---

## License

MIT License. Developed for community and personal productivity.
