const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes          = require('./routes/auth');
const chatRoutes          = require('./routes/chat');
const conversationRoutes  = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sloppy-ai';
const SESSION_SECRET = process.env.SESSION_SECRET || 'sloppy-ai-secret-change-in-production';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24h
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 sloppy.ai running on http://localhost:${PORT}`);
});
