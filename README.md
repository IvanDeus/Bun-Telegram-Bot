# Bun-Telegram-Bot
Simple Telegram Bot With Ngrok Webhook Setup
# TypeScript Telegram Bot with Webhook and Ngrok

A simple Telegram bot with multilanguage support that uses webhooks, with ngrok for local development and testing. The bot responds to `/start` and `/help` commands and provides a default response for all other messages.

## Features

- Webhook-based Telegram bot using express
- Ngrok integration for exposing local server to the internet
- Separate configuration file for easy setup
- Clean shutdown and resource cleanup
- Comprehensive logging

## Prerequisites

- Bun 1.3.9 or higher
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Ngrok account (free tier works fine) and auth token

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/IvanDeus/Bun-Telegram-Bot.git
cd Bun-Telegram-Bot
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up configuration**

Copy the example config file:
```bash
cp config.json.example config.json
```

Edit `config.json` and add your tokens:
```
{
  "BOT_TOKEN": "your-bot-token",
  "NGROK_AUTH_TOKEN": "your-ngrok-token"
}
```

## 📡 Usage

1. **Run the bot**
```bash
bun run bot.ts
```

2. **Expected output**
```
[23/02/2026, 16:45:43] Ngrok tunnel established: https://xxxxxxxxx-xxx.ngrok-free.app
[23/02/2026, 16:45:45] Webhook set successfully!
[23/02/2026, 16:45:45] Webhook info: URL=https://xxxxxxxxxx-xxx.ngrok-free.app/webhook, pending updates=0
[23/02/2026, 16:45:45] Starting server on 127.0.0.1:7777
[23/02/2026, 16:46:36] Start command from user 5555555555
```

3. **Test your bot**
- Open Telegram and find your bot
- Send `/start` and `/help` commands
- Send any other message
- The bot should respond accordingly

## 📁 Project Structure

```
Bun-Telegram-Bot/
├── bot.ts                 # Main bot application
├── config.json            # Configuration file (create from example)
├── config.json.example    # Example configuration template
├── messages.json          # All bot messages in several languages 
├── package.json           # Dependencies
├── README.md              # This file
└── .gitignore            # Git ignore rules
```

## 🔧 How It Works

1. **Express Server**: Runs locally on port 7777, handling webhook requests at `/webhook`
2. **Ngrok Tunnel**: Creates a secure public URL that forwards to your local server
3. **Telegram Webhook**: Configures Telegram to send updates to your ngrok URL
4. **Message Handlers**:
   - `/start` command: Returns a welcome message
   - All other messages: Returns a simple default response

## 🧹 Cleanup

The bot automatically:
- Removes the webhook on shutdown
- Kills ngrok processes
- Performs proper resource cleanup

## ⚠️ Important Notes

- The ngrok URL changes each time you restart the bot (free tier)
- Keep the script running to maintain the webhook
- The bot will stop responding if you close the terminal
- For production, consider using a VPS instead of ngrok

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 
2026 [ ivan deus ]
