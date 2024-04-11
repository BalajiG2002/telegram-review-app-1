const fs = require('fs').promises;

const ExcelJS = require('exceljs');
const TelegramBot = require('node-telegram-bot-api');
const Sentiment = require('sentiment');
const axios = require('axios');

const bot = new TelegramBot('6813561026:AAFBREz5ol4KE9koLcmbWUa9SFySnDCq_AU', { polling: true });
const groupChatId = '-1002127646263';
const responsesFile = 'responses.json';
const excelFile = 'reviews.xlsx';

let userResponses = {};
const sentimentAnalyzer = new Sentiment();

async function loadResponses() {
  try {
    const data = await fs.readFile(responsesFile, 'utf8');
    return JSON.parse(data) || {};
  } catch (error) {
    return {};
  }
}

async function saveResponses() {
  try {
    await fs.writeFile(responsesFile, JSON.stringify(userResponses), 'utf8');
  } catch (error) {
    console.error('Error saving responses:', error);
  }
}

async function sendReviewToAdmin(chatId, userId, response, senderInfo, rating) {
  const senderInfoText = `Sender ID: ${senderInfo.userId}, Sender Username: ${senderInfo.username}`;
  await bot.sendMessage(chatId, `Review: ${response}\n${senderInfoText}\nRating: ${rating}`);
}

async function processReview(userId, response, chatId) {
  userResponses[userId] = { response, senderInfo: { userId, username: 'Unknown' } };

  try {
    const user = await bot.getChatMember(chatId, userId);
    userResponses[userId].senderInfo.username = user.user.username || 'Unknown';
  } catch (error) {
    console.error('Error getting user information:', error);
  }

  await saveResponses();
}

async function analyzeReviewsAndSendToAdmin(chatId) {
    // Analyze reviews and send to admin
    for (const [userId, { response, senderInfo }] of Object.entries(userResponses)) {
      const result = sentimentAnalyzer.analyze(response);
      const rating = result.score;
  
      await sendReviewToAdmin(chatId, userId, response, senderInfo, rating);
    }
  
    // Send sentiment data to the backend
    try {
      await axios.post('http://localhost:3001/api/sentiments', { userResponses });
    } catch (error) {
      console.error('Error sending sentiment data to backend:', error);
    }
  
    // Clear the responses
    userResponses = {};
    await saveResponses();
  
    console.log('Reviews sent to admin and sentiment data sent to the backend.');
  }



async function getSentimentScores(chatId) {
  // Get sentiment scores and send to admin
  for (const [userId, { response, senderInfo }] of Object.entries(userResponses)) {
    const result = sentimentAnalyzer.analyze(response);
    const rating = result.score;

    const senderInfoText = `Sender ID: ${senderInfo.userId}, Sender Username: ${senderInfo.username}`;
    const message = `Review: ${response}\n${senderInfoText}\nRating: ${rating}`;
    
    await bot.sendMessage(chatId, message);
  }
}

async function writeDetailsToExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Reviews');

  // Add headers
  sheet.addRow(['Review', 'Sender ID', 'Sender Username', 'Rating']);

  // Add data
  for (const [userId, { response, senderInfo }] of Object.entries(userResponses)) {
    const result = sentimentAnalyzer.analyze(response);
    const rating = result.score;

    sheet.addRow([response, senderInfo.userId, senderInfo.username, rating]);
  }

  // Save to file
  await workbook.xlsx.writeFile(excelFile);
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! I am your review collector bot. Send your reviews with /review command.');
});

bot.onText(/\/review (.+)/, async (msg, match) => {
    const userId = msg.from.id;
  
    // Save the user's response locally
    await processReview(userId, match[1], msg.chat.id);
  
    // Send the review to the server-side API
    try {
      const response = await axios.post('http://localhost:4000/api/submit-review', {
        userId,
        response: match[1]
      });
  
      console.log('Review submitted to server:', response.data);
      bot.sendMessage(userId, 'Your review has been submitted! Thanks!');
    } catch (error) {
      console.error('Error submitting review to server:', error);
      bot.sendMessage(userId, 'An error occurred while submitting your review.');
    }
  });
  

bot.onText(/\/sendreviews/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if the sender is the group admin
  if (msg.from.id === chatId) {
    // Send collected reviews to the admin
    await analyzeReviewsAndSendToAdmin(chatId);

    // Clear the responses
    userResponses = {};
    await saveResponses();

    bot.sendMessage(chatId, 'Reviews sent to the admin.');
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

bot.onText(/\/getreviews/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if the sender is the group admin
  if (msg.from.id === chatId) {
    // Get collected reviews
    await analyzeReviewsAndSendToAdmin(chatId);
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

bot.onText(/\/getscores/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if the sender is the group admin
  if (msg.from.id === chatId) {
    // Get sentiment scores and send to admin
    await getSentimentScores(chatId);
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

bot.onText(/\/writeexcel/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if the sender is the group admin
  if (msg.from.id === chatId) {
    // Write details to Excel file
    await writeDetailsToExcel();
    
    // Inform the admin
    bot.sendMessage(chatId, 'Details written to Excel file.');
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

// Handle private messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
  
    // Check if the message is not a command and came from a group member
    if (!msg.text.startsWith('/') && msg.chat.type === 'private') {
      bot.sendMessage(chatId, 'Please use /review command in the group chat to submit your review.');
    }
  });