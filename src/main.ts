import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';
import { getReceiptData, receiptToCSV } from './mindee';

const token = process.env.TELEGRAM_BOT_TOKEN!;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Welcome to the Receipt Bot! Please, send a photo of a receipt.");
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.photo) {
    bot.sendMessage(chatId, "Photo received, processing...");
    const receiptData = await getReceiptData(await getPhotoLink(msg.photo));
    if (!receiptData) {
      bot.sendMessage(chatId, "Sorry, I couldn't read the receipt.");
      return;
    }
    const isoDate = new Date().toISOString();
    sendFile(chatId, Buffer.from(JSON.stringify(receiptData)), `receipt - ${isoDate}.json`, "application/json");
    sendFile(chatId, Buffer.from(receiptToCSV(receiptData)), `receipt - ${isoDate}.csv`, "text/csv");
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

