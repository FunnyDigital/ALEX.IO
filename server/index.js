require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// User profile and wallet routes (Firestore)
app.use('/api/user', require('./routes/user_firestore'));

// Basic games routes

// Advanced games routes
// Firestore-based games routes
app.use('/api/games', require('./routes/games/firestore'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
