# Telegram bot receipt

Send images of receipts to Telegram and get back the information of the receipt in CSV format.

[Uses the mindee API](https://platform.mindee.com/mindee/expense_receipts), which is **free up to 250 scans** per month.

## Configuration

Add a .env file with or add the following env variables

```
TELEGRAM_BOT_TOKEN=...
MINDEE_API_KEY=...
```

## How to run

After installing the npm packages (`npm install`), use:

```
npm run build
npm start
```