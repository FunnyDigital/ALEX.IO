
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


// MongoDB removed. All data now uses Firestore/Firebase.

// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Authentication routes - temporarily commented out due to mongoose dependency
// app.use('/api/auth', require('./routes/auth'));

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
