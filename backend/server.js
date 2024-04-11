const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // For database connection (optional)
const config = require('./config'); // Configuration file (consider using environment variables)

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON body data

// Connect to MongoDB using Mongoose URI from config (optional)
if (config.mongoURI) {
  mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));
}

// Define your review model (optional)
const ReviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  review: { type: String, required: true },
  rating: { type: Number }, // Optional for sentiment score
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', ReviewSchema); // Review model (optional)

// Define API endpoints for review management (optional)
async function submitReview(req, res) {
  const { userId, review, rating } = req.body; // Extract data from request

  const newReview = new Review({ userId, review, rating }); // Create a new Review object (optional)
  try {
    if (config.mongoURI) { // Save to database if MongoDB is configured
      await newReview.save();
    }
    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
}

async function getReviews(req, res) {
  try {
    if (config.mongoURI) { // Fetch from database if MongoDB is configured
      const reviews = await Review.find();
      res.json(reviews);
    } else {
      res.json([]); // Return empty array if not using database
    }
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: 'Error getting reviews' });
  }
}

// Configure API endpoints (optional)
if (config.mongoURI) { // Only create endpoints if database is configured
  app.post('/api/submit-review', submitReview);
  app.get('/api/get-reviews', getReviews);
}

// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: 'Internal server error' });
});

// Start the server on the configured port or default to 4000
const port = config.port || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
