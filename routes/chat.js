const express = require('express');
const router = express.Router();

// Auth guard middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
}

// POST /api/chat/message
router.post('/message', requireAuth, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const reply = `Cześć, powiedziałeś: "${message.trim()}", pozwól mi odpowiedzieć na Twoje pytanie....`;
  res.json({ reply });
});

module.exports = router;
