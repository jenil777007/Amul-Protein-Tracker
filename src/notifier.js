import axios from 'axios';


export async function sendTelegramNotification(botToken, chatId, message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  console.log(`[NOTIFIER] Sending Telegram notification to chatId: ${chatId}`);
  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log(`[NOTIFIER] Telegram notification sent. Status: ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.error(`[NOTIFIER] Telegram notification failed. Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`[NOTIFIER] Telegram notification failed: ${error.message}`);
    }
    return false;
  }
}
