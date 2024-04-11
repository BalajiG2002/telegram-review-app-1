const bcrypt = require('bcrypt');
const sentiment = require('sentiment'); // Optional sentiment library

const resolvers = {
  Mutation: {
    register: async (_, { username, password }) => {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await new User({ username, password: hashedPassword }).save();

      return user;
    },
    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('Invalid username or password');
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid username or password');
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return { token, user };
    },
    submitReview: async (_, { text }, context) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      // Process and store the review
      const newReview = await new Review({
        userId: context.user,
        text,
      }).save();

      return newReview;
    },
  },
  Query: {
    reviews: async (_, { after, limit, sortBy }, context) => {
      // Check authorization for admin
      if (!context.user || !context.user.isAdmin) {
        throw new Error('Unauthorized');
      }

      const query = {};
      if (after) {
        query._id = { $gt: new mongoose.Types.ObjectId(after) };
      }

      if (sortBy) {
        const sortCriteria = {};
        sortCriteria[sortBy] = 1; // Ascending order (modify for descending)
        query.$sort = sortCriteria;
      }

      if (limit) {
        query.limit = limit;
      }

      const reviews = await Review.find(query).populate('userId');

      // Optional sentiment analysis (modify based on your needs)
      if (process.env.ENABLE_SENTIMENT_ANALYSIS) {
        for (const review of reviews) {
          if (!review.sentiment || !review.score) { // Check if analysis already exists
            const analysis = sentiment(review.text);
            review.sentiment = analysis.comparative;
            review.score = analysis.score;
            await review.save(); // Save the updated review with sentiment data
          }
        }
      }

      return reviews;
    },
  },
};

module.exports = resolvers;
