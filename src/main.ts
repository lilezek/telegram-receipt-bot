import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';
import { getReceiptData, receiptToCSV } from './mindee';

const token = process.env.TELEGRAM_BOT_TOKEN!;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Welcome to the Receipt Bot! Please, send a photo of a receipt.");
});

const callbackMap = new Map<number, string>();

bot.onText(/\set_callback (.*)/, (msg, match) => {
  const chatId = msg.chat.id;

  const httpCallback = match![1];

  callbackMap.set(chatId, httpCallback);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.photo) {
    if (!callbackMap.has(chatId)) {
      bot.sendMessage(chatId, "Please, set a callback URL first, using /set_callback <URL>.");
      return;
    }

    bot.sendMessage(chatId, "Photo received, processing...");
    const receiptData = await getReceiptData(await getPhotoLink(msg.photo));
    if (!receiptData) {
      bot.sendMessage(chatId, "Sorry, I couldn't read the receipt.");
      return;
    }
    const isoDate = new Date().toISOString();
    const csvData = receiptToCSV(receiptData);
    sendFile(chatId, Buffer.from(JSON.stringify(receiptData)), `receipt - ${isoDate}.json`, "application/json");
    sendFile(chatId, Buffer.from(csvData), `receipt - ${isoDate}.csv`, "text/csv");

    const callbackUrl = callbackMap.get(chatId)!;
    const callbackResponse = await fetch(callbackUrl, {
      method: 'POST',
      body: csvData,
      headers: {
        'Content-Type': 'text/csv'
      }
    });

    if (callbackResponse.ok) {
      bot.sendMessage(chatId, "Data sent to callback URL.");
    } else {
      bot.sendMessage(chatId, "Failed to send data to callback URL.");
    }
  }
});

async function getPhotoLink(photoArray: TelegramBot.PhotoSize[]) {
  // Get the biggest photo by file_size
  const photo = photoArray.reduce((prev, current) => {
    return (prev.file_size! > current.file_size!) ? prev : current
  }, photoArray[0]);

  return bot.getFileLink(photo.file_id);
}

function sendFile(chatId: number, buffer: Buffer, fileName: string, contentType: string) {
  bot.sendDocument(chatId, buffer, {}, {
    filename: fileName,
    contentType: contentType
  });
}

