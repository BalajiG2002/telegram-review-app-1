require('dotenv').config();

module.exports = {
  mongoURI: 'mongodb://localhost:27017/',
  jwtSecret: '00f6e7ae036222b68ce07ec675f7d7eff08be09f9646e4143f1291c7d3de8a57',
  enableSentimentAnalysis: process.env.ENABLE_SENTIMENT_ANALYSIS === 'true', // Convert to boolean
};
