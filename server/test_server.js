// Simple test server to isolate connection issues
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Simple test server is running');
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Server failed to start:', err);
  } else {
    console.log(`Test server running on http://0.0.0.0:${PORT}`);
  }
});