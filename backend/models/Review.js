const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sentiment: { // Optional field for sentiment analysis result
    type: String,
  },
  score: { // Optional field for sentiment analysis score
    type: Number,
  },
});

module.exports = mongoose.model('Review', reviewSchema);
