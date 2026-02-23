// bot.ts by ivan deus (TypeScript + Bun version)
// ============= LOGGING =============
const originalLog = console.log;
const originalError = console.error;

console.log = function (message: unknown, ...args: unknown[]) {
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Moscow' });
    const formattedMessage = `[${timestamp}] ${Bun.inspect(message)}${args.length ? ' ' + args.map(a => Bun.inspect(a)).join(' ') : ''}`;
    originalLog.apply(console, [formattedMessage]);
};

console.error = function (message: unknown, ...args: unknown[]) {
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Moscow' });
    const formattedMessage = `[${timestamp}] [ERROR] ${Bun.inspect(message)}${args.length ? ' ' + args.map(a => Bun.inspect(a)).join(' ') : ''}`;
    originalError.apply(console, [formattedMessage]);
};

// ============= IMPORTS =============
import { Bot, InlineKeyboard, webhookCallback, Context } from "grammy";
import express, { Express, Request, Response } from "express";
import * as ngrok from "@ngrok/ngrok";
// Bun native file operations
import config from "./config.json" with { type: "json" };

// ============= TYPE DEFINITIONS =============
interface Message {
    text: string;
}

interface LanguageMessages {
    [key: string]: Message;
}

interface Messages {
    [language: string]: LanguageMessages;
}

interface Config {
    BOT_TOKEN: string;
    WEBHOOK_PATH: string;
    LOCAL_HOST: string;
    LOCAL_PORT: number;
    NGROK_AUTH_TOKEN?: string;
}

const typedConfig = config as Config;

// User languages storage
const userLanguages = new Map<number, string>();

// ============= MESSAGE LOADING =============
let ALL_MESSAGES: Messages;

async function loadAllMessages(): Promise<Messages> {
  try {
    const file = Bun.file("messages.json");
    const exists = await file.exists();
    
    if (!exists) {
      console.error("messages.json file not found! Using default messages.");
      return getDefaultMessages();
    }
    const data = await file.text();
    return JSON.parse(data) as Messages;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error("Invalid JSON in messages.json! Using default messages.");
      return getDefaultMessages();
    }
    throw err;
  }
}

function getDefaultMessages(): Messages {
  return {
    en: {
      welcome: { text: "👋 Hello!" },
      default_response: { text: "Default" },
      language_prompt: { text: "Select language:" },
      language_changed: { text: "Language changed" },
      help: { text: "Commands:\n/start\n/language\n/help" },
    },
    es: {
      welcome: { text: "👋 ¡Hola!" },
      default_response: { text: "Mensaje." },
      language_prompt: { text: "Selecciona idioma:" },
      language_changed: { text: "Idioma cambiado" },
      help: { text: "Comandos:\n/start\n/language\n/help" },
    },
  };
}

// Load all messages
ALL_MESSAGES = await loadAllMessages();

function getMessage(userId: number, messageKey: string): string {
  // Default to English
  const language = userLanguages.get(userId) || "en";
  return ALL_MESSAGES[language]?.[messageKey]?.text || `Message not found: ${messageKey}`;
}

// ============= BOT INITIALIZATION =============
const bot = new Bot(typedConfig.BOT_TOKEN);

// Express app for webhook
const app: Express = express();
app.use(express.json());
// ============= MESSAGE HANDLERS =============
// Handle /start
bot.command("start", async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  const welcomeText = getMessage(userId, "welcome");
  await ctx.reply(welcomeText, { parse_mode: "Markdown" });
  console.log(`Start command from user ${userId}`);
});

// Handle /help
bot.command("help", async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  const helpText = getMessage(userId, "help");
  await ctx.reply(helpText, { parse_mode: "Markdown" });
  console.log(`Help command from user ${userId}`);
});

// Handle /language
bot.command("language", async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  const keyboard = new InlineKeyboard()
    .text("🇬🇧 English", "lang_en")
    .text("🇪🇸 Español", "lang_es");
  const promptText = getMessage(userId, "language_prompt");
  await ctx.reply(promptText, { reply_markup: keyboard });
});

// Handle callback queries
bot.callbackQuery(/^lang_/, async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId || !ctx.callbackQuery) return;
  
  const lang = ctx.callbackQuery.data.split("_")[1];
  userLanguages.set(userId, lang);
  await ctx.answerCallbackQuery();
  const confirmationText = getMessage(userId, "language_changed");
  await ctx.editMessageText(confirmationText);
  console.log(`User ${userId} changed language to ${lang}`);
});

// Default response for other text messages (after commands)
bot.on("message:text", async (ctx: Context) => {
  const text = ctx.message?.text?.trim();
  if (!text) return;
  
  if (!text.startsWith("/")) {
    const userId = ctx.from?.id;
    if (!userId) return;
    
    const responseText = getMessage(userId, "default_response");
    await ctx.reply(responseText);
    console.log(`Message from user ${userId}: ${text}`);
  }
});

// Webhook middleware
app.use(typedConfig.WEBHOOK_PATH, webhookCallback(bot, "express"));

async function setupWebhook(): Promise<boolean> {
  try {
    // Create ngrok tunnel
    const session = await ngrok.connect({
      addr: `${typedConfig.LOCAL_HOST}:${typedConfig.LOCAL_PORT}`,
      authtoken: typedConfig.NGROK_AUTH_TOKEN,
    });
    const publicUrl = session.url();
    const webhookUrl = `${publicUrl}${typedConfig.WEBHOOK_PATH}`;
    console.log(`Ngrok tunnel established: ${publicUrl}`);

    // Remove existing webhook and set new one
    await bot.api.deleteWebhook();
    // Short delay to ensure deletion
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await bot.api.setWebhook(webhookUrl);

    console.log("Webhook set successfully!");
    const webhookInfo = await bot.api.getWebhookInfo();
    console.log(`Webhook info: URL=${webhookInfo.url}, pending updates=${webhookInfo.pending_update_count}`);
    return true;
  } catch (err) {
    console.error(`❌ Error setting up webhook: ${err}`);
    return false;
  }
}

async function cleanup(): Promise<void> {
  try {
    await bot.api.deleteWebhook();
    await ngrok.disconnect();
    console.log("Cleanup completed");
  } catch (err) {
    console.error(`Error during cleanup: ${err}`);
  }
}

// Handle shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await cleanup();
  process.exit(0);
});

// ============= MAIN EXECUTION =============
if (await setupWebhook()) {
  app.listen(typedConfig.LOCAL_PORT, typedConfig.LOCAL_HOST, () => {
    console.log(`Starting server on ${typedConfig.LOCAL_HOST}:${typedConfig.LOCAL_PORT}`);
  });
} else {
  console.error("Failed to setup webhook. Exiting.");
}
