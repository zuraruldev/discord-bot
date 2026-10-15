# Discord Bot (fx)

A multifunctional Discord bot written in TypeScript and Oceanic.js, featuring an Autonomous DevOps, Coding, & Discord Management Agent companion (Alya-san), NVIDIA SkillSpector security auditing, interactive geography and Wordle games, an automated university class reminder system, live VPS and bot system monitoring, and a virtual Linux-style vault filesystem.

---

## Features

### 1. Alya Autonomous AI Agent & Multimodal Vision Companion
- **Character**: Alisa Mikhailovna Kujou (Alya-san / Alyssa Novellia) from *Alya Sometimes Hides Her Feelings in Russian*.
- **Persona & Tone**: Autonomous DevOps & Coding Agent companion: smart, playful, witty, and expressive with emojis (`🌸✨`, `🚀✨`, `🫡✨`), delivering structured, high-quality technical explanations in Discord Markdown with dynamic, varied conversational closings. Communicates fluently in Indonesian, English, and Russian.
- **Multimodal Vision Intelligence**:
  - Automatically analyzes image attachments, image URLs, and images in replied/referenced messages (PNG, JPEG, WEBP, GIF).
  - Can read diagrams, error screenshots, architectural layouts, and charts directly from Discord chat.
- **Autonomous Tool Arsenal (37+ Active Tools)**:
  - **Coding & Sandbox**: `read_code_file`, `edit_code_file`, `write_code_file`, `execute_code`, `list_dir`, `search_files`, `set_workdir`, `manage_sandbox_service`, `lint_and_format_code`, `code_architect_review`.
  - **Discord & Community**: `server_info`, `moderate`, `manage_schedule`, `set_afk`, `set_reminder`, `send_dm`, `ask_owner`, `read_file`, `fetch_web_page`, `inspect_image`, `fetch_youtube_transcript`, `search_novel_catalog`.
  - **Reasoning & Agentic**: `remember`, `recall`, `forget_memory`, `edit_memory`, `sequential_thinking`, `spawn_subagent`, `manage_task_plan`, `use_skill`, `create_skill_from_chat`, `scan_skill_security`, `clarify`.
  - **Vault & Web**: `vault_mkdir`, `vault_write`, `vault_delete`, `vault_read`, `vault_list`, `web_search`.
- **Resilient Web Search & Fetching**:
  - DuckDuckGo Lite integration with automatic anti-bot challenge bypass for server and datacenter IPs.
  - Dedicated `fetch_web_page` tool for scraping clean article text, official docs, and GitHub repositories (auto-fetching `README.md`).
- **Provider**: Powered by local 9router AI or any OpenAI-compatible API (`AI_API_BASE`, `AI_API_KEY`, `AI_MODEL`).
- **Dedicated Channels**: Operates in designated channels (`CHAT_CHANNEL_ID` and allowed list) to keep other server channels clean.
- **Server Security & Admin Authority**:
  - Even with Discord Administrator permissions, Alya strictly rejects any kick, ban, timeout, or role manipulation requests from regular users.
  - Sensitive tools (terminal execution, code editing, moderation) are protected by Role-Based Access Control (`adminOnly`) and never exposed in the LLM tool schemas of regular users.

### 2. NVIDIA SkillSpector Security Scanner & Guardrails
- **Security Scanner for AI Agent Skills**: Integrated with NVIDIA's open-source SkillSpector engine (AST analyzer, YARA signatures, taint tracking, and OSV.dev CVE lookups).
- **Discord Command**:
  - `fx scan-skill <url git | path file | lampiran file>` - Generates a comprehensive security audit embed with Risk Score (0–100), severity labels (LOW/MEDIUM/HIGH/CRITICAL), recommendation (SAFE/CAUTION/DANGEROUS/BLOCKED), and itemized vulnerability explanations.
- **Agent Chat Integration**:
  - Alya can autonomously invoke `scan_skill_security` during chat to inspect repos, scripts, and skills, explaining potential risks and mitigations in friendly language.
- **Creation Guardrail**:
  - Automatically scans new skill SOPs generated via `create_skill_from_chat`, instantly rejecting malicious patterns (prompt injection, external curl-to-bash, credential exfiltration) before saving.

### 3. Class Schedule & Automated 5:00 AM Reminder
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

### 4. Server & Bot Live Monitoring
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

### 5. Linux-Style Vault Filesystem
- **Virtual Filesystem**: Hierarchical folder and file structure stored persistently in `data/vault.json`.
- **Commands**:
  - `fx vault ls [path]` - List files and directories.
  - `fx vault cat <path>` - Read file contents.
  - `fx vault write <path> <content...>` - Write or overwrite a file.
  - `fx vault touch <path>` - Create an empty file.
  - `fx vault mkdir <path>` - Create a directory.
  - `fx vault rm <path>` - Remove a file or empty directory.
  - `fx vault stat <path>` - View file/directory metadata.

### 6. Quiz & Wordle Games
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
- Node.js 18+ (tested on Node.js 22 & 26)
- npm or pnpm
- Python 3.12+ & `uv` (for NVIDIA SkillSpector scanner)
- Discord Bot Token with Message Content and Server Members intents enabled

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/zuraruldev/discord-bot.git
cd discord-bot
npm install
```

### 2. Install NVIDIA SkillSpector (Optional for Security Features)
```bash
# Install uv tool
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install SkillSpector
uv tool install git+https://github.com/NVIDIA/skillspector.git
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:
```ini
TOKEN=your_discord_bot_token_here
PREFIX=fx
AI_API_BASE=http://localhost:20128/v1
AI_API_KEY=your_ai_key_here
AI_MODEL=ag/gemini-3.8-flash-low
ADMIN_USER_IDS=1256220010859466795,910785829549539338
CHAT_CHANNEL_ID=1555508577945522206
```

### 4. Build & Run
```bash
# Build TypeScript with esbuild
npm run build

# Start bot process
npm start
```

### 5. Code Quality & Linting
```bash
# Run ESLint checks
npm run lint
```

---

## License

MIT License. Developed for community and personal productivity.
