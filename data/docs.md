# Discord Bot Project 0.1 - Documentation & Command Database

## 1. Project Overview & Changelog

### Stability & Error Handling
- Gateway Error Handling: Attached listeners for `error`, `warn`, `shardDisconnect`, and `shardResume` to Oceanic client (`src/Client.ts`) preventing unhandled 'error' and WebSocket disconnect crashes.
- Extended Timeouts: Configured gateway connection timeout to 30,000ms with infinite reconnect attempts (`maxReconnectAttempts: Infinity`). Set REST request timeout to 30,000ms with 60,000ms ratelimit retry window (`maxRatelimitRetryWindow: 60000`).
- Error Logging Safeguards: `logError` in `src/utils.ts` now prevents recursive error storms when sending error logs to Discord, and wraps network calls in safe async try/catch blocks.

### Core Configuration & Prefix
- Prefix: Default bot prefix updated from `geo` to `fx`. Fully configurable via `PREFIX` environment variable.
- Channel IDs & Decoupling (.env):
  - Bug & Error Logging: `ERROR_LOG_CHANNEL_ID=1548643055614165092` (fallback `BUG_CHANNEL_ID`)
  - Class Reminder & Matkul: `MATKUL_CHANNEL_ID=1548318224636977233` (fallback `REMINDER_CHANNEL_ID`)
  - Server & Bot Status Monitoring: `STATUS_CHANNEL_ID=1548338205928202321` (fallback `MONITORING_CHANNEL_ID`)
  - Admin User IDs: `ADMIN_USER_IDS=1256220010859466795,910785829549539338`

### Admin Permissions & Command Hiding
- Authorized Admins: User IDs `1256220010859466795` and `910785829549539338` have full administrative privileges.
- Admin Command Hiding: Commands marked with `adminOnly: true` or `hidden: true` (e.g., `reminder`, `status`, administrative subcommands) are strictly hidden from non-admin users in `fx help`. Non-admins attempting to execute admin commands receive plain-text permission denial messages.

### Text Formatting & Plain Text Policy
- All emojis have been removed across reminder embeds, status embeds, and command outputs, keeping messages clean and formatted in plain text.

### Redesigned Help Command
- Category structure reorganized into:
  - `General`: `help`, `matkul`, `vault`
  - `Geography Quiz`: `flag`, `capital`, `united-states`, `kabupaten`, `province`, `language`, `aliases`
  - `Wordle Quiz`: `wordy`, `katla`, `surrender`, `stats`, `colorblind`, `show`
  - `Coding Quiz (coming soon)`: `code`
  - `Admin`: `reminder`, `status` (only visible to admins)

### Live VPS & Bot Status Monitoring (`src/module/monitoring.ts`, `src/command/status.ts`)
- Persistent Live Embed: Displays Hostname, OS platform, VPS uptime, Bot process uptime, Gateway latency, RAM usage, CPU model & load averages (1m, 5m, 15m), and Disk space usage.
- Auto-updates every 60 seconds to channel `1548338205928202321`.
- Graceful Shutdown Handling: Catches `SIGINT` / `SIGTERM` signals and updates the embed to `Server & Bot Status [OFFLINE]` with shutdown reason before process exit.
- System Threshold Alerts: Automatically sends alert embeds to the bug log channel if VPS RAM or Disk space usage reaches 90% or higher.

### Class Schedule & Matkul System (`src/schedule/store.ts`, `src/command/matkul.ts`, `src/module/reminder.ts`)
- Configured default class schedule:
  - Monday: Keterampilan Komputer (07:30 - 11:10 @ GTIL 5.7), Pancasila (13:50 - 15:30 @ GKB 4.5)
  - Tuesday: Arsitektur Komputer (08:20 - 11:10 @ GKB 4.6), Bahasa Indonesia (13:50 - 15:30 @ GKB 3.8)
  - Wednesday: Algoritma Programming (09:25 - 10:15 @ GKB 4.6), Basis data (10:20 - 11:10 @ GKB 4.6), Algoritma programming (11:15 - 15:30 @ GTIL 5.6)
  - Thursday: Matematika Dasar (08:20 - 11:10 @ GKB 3.8), Pengantar Sistem Informasi (13:50 - 15:30 @ GKB 4.2)
  - Friday: Basis Data (07:30 - 11:10 @ GTIL 5.7)
- Automated Reminder: Runs automatically at 5:00 AM (Asia/Jakarta, Monday to Friday) and posts schedule to the matkul channel.
- User Commands: Any member can check today's classes (`fx matkul`), specific day (`fx matkul senin`), or the entire week (`fx matkul list`).
- Admin Management: Admins can dynamically add classes (`fx matkul add`), remove classes (`fx matkul remove`), clear days (`fx matkul clear`), set destination channels (`fx matkul setchannel`), or force-dispatch reminders (`fx matkul send`).

### Linux-Style Vault Filesystem (`src/vault/store.ts`, `src/command/vault.ts`)
- Virtual personal drive and database notepad.
- Directory & File Management: `mkdir`, `touch`, `printf` (supports append `>>` and overwrite `>`), `cat`, `ls`, `tree`, `rm`, `cp`, `mv`, and `grep`.
- Web Fetching:
  - `curl <url> > <path>` or `curl <url> >> <path>` to save remote API/text data directly to a file.
  - `wget <url> [path]` to download web resources.
- Peer Sharing:
  - `share <path> <@user>` grants another user access to read the file.
  - `shared` lists files shared with you.
  - `cat <@owner>:<path>` or `shared cat <@owner> <path>` reads shared files.
  - `unshare <path> <@user>` revokes file access.
- Quotas: Enforces a 1 MB storage quota per user with `df` / `quota` inspection.

---

## 2. Command Reference & Usage Guide

### General Commands

#### `fx help`
- Purpose: Lists all available commands by category. Non-admins will not see the Admin category.
- Syntax: `fx help [command]`
- Examples:
  - `fx help` - Shows command list
  - `fx help matkul` - Shows details for matkul command
  - `fx help vault` - Shows details for vault command

#### `fx alya`
- Aliases: `ask`, `chat`, `a`
- Permission: Everyone (Channel restricted to `1555508577945522206`)
- Purpose: Interactive AI chat with Alisa Mikhailovna Kujou (Alya-san / Alyssa Novellia). Autonomous DevOps & Coding Agent companion: smart, playful, witty, and expressive with emojis, featuring structured technical breakdowns and Discord-style responses. Automatically responds to pings, replies, name triggers (`alya`, `kujou`, `alisa`), or the command inside channel `1555508577945522206`.
- Syntax: `fx alya <pesan>` or `@Bot <pesan>` or mentioning `alya` / `kujou`
- Examples:
  - `fx alya halo Alya`
  - `alya bagaimana cara menggunakan command vault?`
  - `@Bot siapa yang membuatmu?`
  - `alya tolong jelasin jadwal kuliah hari ini dong`

#### `fx matkul`
- Aliases: `jadwal`, `kuliah`, `schedule`, `classes`
- Permission: Viewing: Everyone | Modifying: Admin
- Purpose: Views and manages daily and weekly class schedules.
- Syntax:
  - `fx matkul` - Shows today's classes and room info in chat
  - `fx matkul list` - Shows full Monday to Friday schedule
  - `fx matkul <hari>` - Shows classes for a specific day (senin, selasa, rabu, kamis, jumat)
  - `fx matkul add <hari> <waktu> <ruang> <nama_matkul...>` - (Admin) Adds a course
  - `fx matkul remove <hari> <index>` - (Admin) Removes course by index number
  - `fx matkul clear <hari>` - (Admin) Removes all courses for that day
  - `fx matkul send [hari]` - (Admin) Force-sends schedule reminder to the matkul channel
  - `fx matkul setchannel [channelId]` - (Admin) Sets target channel for daily 5 AM automated reminders
- Examples:
  - `fx matkul`
  - `fx matkul senin`
  - `fx matkul list`
  - `fx matkul add senin 07:30-11:10 GTIL-5.7 Keterampilan Komputer`
  - `fx matkul remove senin 1`
  - `fx matkul send senin`

#### `fx vault`
- Aliases: `v`, `drive`
- Permission: Authorized Users (granted by Admin)
- Purpose: Personal virtual Linux-style database and notepad.
- Syntax:
  - `fx vault user add <@user | id>` - (Admin) Authorizes user and creates vault
  - `fx vault user remove <@user | id>` - (Admin) Revokes access and deletes user vault
  - `fx vault user list` - (Admin) Lists all authorized vault users
  - `fx vault mkdir <path>` - Creates directory
  - `fx vault touch <path>` - Creates an empty file or updates timestamp
  - `fx vault printf "<text>" >> <path>` - Appends text to file
  - `fx vault printf "<text>" > <path>` - Overwrites file with text
  - `fx vault cat <path>` - Reads and displays file contents
  - `fx vault cat <@user>:<path>` - Reads file shared with you
  - `fx vault curl <url> > <path>` - Fetches web URL content into file
  - `fx vault wget <url> [path]` - Downloads remote URL to file
  - `fx vault share <path> <@user>` - Shares file with specified user
  - `fx vault unshare <path> <@user>` - Revokes share access
  - `fx vault shared` - Lists all files shared with you
  - `fx vault ls [path]` - Lists directory entries
  - `fx vault tree [path]` - Displays folder structure tree
  - `fx vault grep <query> [path]` - Searches text inside files
  - `fx vault cp <src> <dest>` - Copies a file
  - `fx vault mv <src> <dest>` - Moves or renames a file
  - `fx vault rm <path>` - Deletes a file or directory
  - `fx vault df` - Displays storage quota usage (1 MB limit)
- Examples:
  - `fx vault mkdir /notes`
  - `fx vault touch /notes/todo.txt`
  - `fx vault printf "Materi Kuliah\\nBab 1 Pengenalan\\n" >> /notes/todo.txt`
  - `fx vault cat /notes/todo.txt`
  - `fx vault curl https://icanhazip.com > /ip.txt`
  - `fx vault share /notes/todo.txt @friend`
  - `fx vault shared`
  - `fx vault cat @friend:/notes/todo.txt`
  - `fx vault grep "Materi" /notes`
  - `fx vault df`

### Admin Commands

#### `fx status`
- Aliases: `monitor`, `vps`
- Permission: Admin Only (Hidden)
- Purpose: Monitors VPS hardware performance, system load, memory, disk, and bot gateway health.
- Syntax:
  - `fx status` - Displays live status metrics in current channel
  - `fx status setchannel [channelId]` - Configures destination channel for persistent auto-updating status embed
  - `fx status refresh` - Manually refreshes the live monitoring embed
- Examples:
  - `fx status`
  - `fx status setchannel 1548338205928202321`
  - `fx status refresh`

#### `fx reminder`
- Aliases: `remind`
- Permission: Admin Only (Hidden)
- Purpose: Backend administration command for class schedule reminders.
- Syntax:
  - `fx reminder` - Force-runs today's reminder to configured channel
  - `fx reminder <day>` - Force-runs reminder for specified day
  - `fx reminder list` - Lists full weekly schedule database
  - `fx reminder setchannel` - Sets reminder channel to current channel

### Geography Quiz Commands

- `fx flag` - Guess the country from its flag image within 30 seconds.
- `fx capital` - Guess the capital city of a country within 30 seconds.
- `fx kabupaten` - Guess the Indonesian kabupaten/regency from a location map within 30 seconds.
- `fx province` - Guess the Indonesian province from a map within 30 seconds.
- `fx united-states` - Guess the US state from an image map within 30 seconds.
- `fx language` - Guess the language from a text phrase within 30 seconds.
- `fx aliases <category> [subcategory] [page]` - Browse valid answer aliases for quiz categories.
  - `fx aliases list` - Shows available categories
  - `fx aliases flags 1` - Shows flag answer aliases

### Wordle Quiz Commands

- `fx wordy <5-letter-guess>` - Guess the 5-letter hidden English word (Wordle).
- `fx katla <5-letter-guess>` - Guess the 5-letter hidden Indonesian word (Katla).
- `fx stats` - Displays your game statistics (wins, losses, surrenders).
- `fx surrender` - Gives up current game and reveals the answer.
- `fx show` - Displays your current game board.
- `fx colorblind` - Toggles colorblind palette mode.

### Coding Quiz (Coming Soon)

- `fx code` - Interactive programming and algorithm quizzes (coming soon).

---

## 3. Machine-Readable Command Database (JSON)

This JSON structure can be loaded into an LLM or conversational bot database to answer user queries about available commands:

```json
[
  {
    "category": "General",
    "name": "help",
    "aliases": ["h"],
    "syntax": "fx help [command]",
    "permission": "Everyone",
    "description": "Displays all available commands or specific help for a command.",
    "examples": ["fx help", "fx help matkul", "fx help vault"]
  },
  {
    "category": "General",
    "name": "matkul",
    "aliases": ["jadwal", "kuliah", "schedule", "classes"],
    "syntax": "fx matkul [hari | list | send | add | remove | clear | setchannel]",
    "permission": "Viewing: Everyone | Modifying/Sending: Admin",
    "description": "View today's or weekly university course schedules, and manage course data.",
    "examples": [
      "fx matkul",
      "fx matkul list",
      "fx matkul senin",
      "fx matkul add senin 07:30-11:10 GTIL-5.7 Keterampilan Komputer",
      "fx matkul remove senin 1",
      "fx matkul send senin"
    ]
  },
  {
    "category": "General",
    "name": "vault",
    "aliases": ["v", "drive"],
    "syntax": "fx vault <subcommand> [arguments...]",
    "permission": "Authorized Users",
    "description": "Virtual Linux-style personal drive and database notepad with web fetch and peer file sharing.",
    "examples": [
      "fx vault mkdir /notes",
      "fx vault touch /notes/todo.txt",
      "fx vault printf \"Line 1\\nLine 2\\n\" >> /notes/todo.txt",
      "fx vault cat /notes/todo.txt",
      "fx vault curl https://icanhazip.com > /ip.txt",
      "fx vault share /notes/todo.txt @username",
      "fx vault shared",
      "fx vault cat @username:/notes/todo.txt",
      "fx vault tree /",
      "fx vault df"
    ]
  },
  {
    "category": "General",
    "name": "alya",
    "aliases": ["ask", "chat", "a"],
    "syntax": "fx alya <pesan> atau @Bot <pesan>",
    "permission": "Everyone",
    "description": "Chat with Alisa Mikhailovna Kujou (Alya-san / Alyssa Novellia). Autonomous DevOps & Coding Agent companion: witty, playful, and expressive with emojis, providing structured technical explanations.",
    "examples": [
      "fx alya halo Alya",
      "fx alya jelaskan tentang bot ini",
      "fx alya siapa yang membuatmu?"
    ]
  },
  {
    "category": "Admin",
    "name": "status",
    "aliases": ["monitor", "vps"],
    "syntax": "fx status [setchannel [channelId] | refresh]",
    "permission": "Admin Only (Hidden)",
    "description": "Monitors VPS CPU, RAM, Disk, Uptime, and Discord Gateway latency.",
    "examples": [
      "fx status",
      "fx status setchannel 1548338205928202321",
      "fx status refresh"
    ]
  },
  {
    "category": "Admin",
    "name": "reminder",
    "aliases": ["remind"],
    "syntax": "fx reminder [day | setchannel | list | add | remove | clear]",
    "permission": "Admin Only (Hidden)",
    "description": "Backend administrative command to test and trigger class schedule reminders.",
    "examples": [
      "fx reminder",
      "fx reminder monday",
      "fx reminder list"
    ]
  },
  {
    "category": "Geography Quiz",
    "name": "flag",
    "syntax": "fx flag",
    "permission": "Everyone",
    "description": "Guess country name from flag image.",
    "examples": ["fx flag"]
  },
  {
    "category": "Geography Quiz",
    "name": "capital",
    "syntax": "fx capital",
    "permission": "Everyone",
    "description": "Guess capital city of a country.",
    "examples": ["fx capital"]
  },
  {
    "category": "Geography Quiz",
    "name": "kabupaten",
    "syntax": "fx kabupaten",
    "permission": "Everyone",
    "description": "Guess Indonesian kabupaten from a map location.",
    "examples": ["fx kabupaten"]
  },
  {
    "category": "Geography Quiz",
    "name": "province",
    "syntax": "fx province",
    "permission": "Everyone",
    "description": "Guess Indonesian province from a map location.",
    "examples": ["fx province"]
  },
  {
    "category": "Geography Quiz",
    "name": "united-states",
    "syntax": "fx united-states",
    "permission": "Everyone",
    "description": "Guess US state from a map location.",
    "examples": ["fx united-states"]
  },
  {
    "category": "Geography Quiz",
    "name": "language",
    "syntax": "fx language",
    "permission": "Everyone",
    "description": "Guess spoken language from sample phrase.",
    "examples": ["fx language"]
  },
  {
    "category": "Geography Quiz",
    "name": "aliases",
    "aliases": ["al", "alias"],
    "syntax": "fx aliases <category> [subcategory] [page]",
    "permission": "Everyone",
    "description": "Browse accepted answer aliases for trivia quizzes.",
    "examples": ["fx aliases list", "fx aliases flags 1"]
  },
  {
    "category": "Wordle Quiz",
    "name": "wordy",
    "syntax": "fx wordy <5-letter-guess>",
    "permission": "Everyone",
    "description": "Play English 5-letter Wordle game.",
    "examples": ["fx wordy apple"]
  },
  {
    "category": "Wordle Quiz",
    "name": "katla",
    "syntax": "fx katla <5-letter-guess>",
    "permission": "Everyone",
    "description": "Play Indonesian 5-letter Wordle game (Katla).",
    "examples": ["fx katla makan"]
  },
  {
    "category": "Wordle Quiz",
    "name": "stats",
    "syntax": "fx stats",
    "permission": "Everyone",
    "description": "View your Wordle game win/loss statistics.",
    "examples": ["fx stats"]
  },
  {
    "category": "Wordle Quiz",
    "name": "surrender",
    "syntax": "fx surrender",
    "permission": "Everyone",
    "description": "Surrender active Wordle game and reveal word.",
    "examples": ["fx surrender"]
  },
  {
    "category": "Wordle Quiz",
    "name": "show",
    "syntax": "fx show",
    "permission": "Everyone",
    "description": "Show active Wordle board guesses.",
    "examples": ["fx show"]
  },
  {
    "category": "Wordle Quiz",
    "name": "colorblind",
    "syntax": "fx colorblind",
    "permission": "Everyone",
    "description": "Toggle colorblind palette for Wordle tiles.",
    "examples": ["fx colorblind"]
  },
  {
    "category": "Coding Quiz",
    "name": "code",
    "syntax": "fx code",
    "permission": "Everyone",
    "description": "Interactive coding challenges and quizzes (coming soon).",
    "examples": ["fx code"]
  }
]
```
