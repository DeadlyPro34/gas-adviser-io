const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/defi-gas-predictor';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Connected to MongoDB successfully.');
  })
  .catch((err) => {
    console.warn(' MongoDB connection warning:', err.message);
    console.warn(' Running without database persistence until MONGO_URI is configured.');
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DeFi Fee & Timing Predictor Backend is running.',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
