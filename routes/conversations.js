const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

// GET /api/conversations — lista konwersacji użytkownika (bez wiadomości)
router.get('/', requireAuth, async (req, res) => {
  try {
    const convs = await Conversation.find({ userId: req.session.userId })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 });
    res.json(convs);
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/conversations — utwórz nową konwersację
router.post('/', requireAuth, async (req, res) => {
  try {
    const conv = new Conversation({ userId: req.session.userId });
    await conv.save();
    res.status(201).json({ _id: conv._id, title: conv.title, updatedAt: conv.updatedAt });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/conversations/:id — pobierz konwersację z wiadomościami
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!conv) return res.status(404).json({ error: 'Not found.' });
    res.json(conv);
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/conversations/:id/message — dodaj wiadomość i odpowiedź bota
router.post('/:id/message', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    const userMsg = message.trim();
    const botReply = `Cześć, powiedziałeś: "${userMsg}", pozwól mi odpowiedzieć na Twoje pytanie....`;

    conv.messages.push({ role: 'user', content: userMsg });
    conv.messages.push({ role: 'bot',  content: botReply });

    // Auto-title: ustaw tytuł na podstawie pierwszej wiadomości
    if (conv.messages.length === 2) {
      conv.title = userMsg.length > 40 ? userMsg.slice(0, 40) + '…' : userMsg;
    }

    conv.updatedAt = new Date();
    await conv.save();

    res.json({ reply: botReply, title: conv.title });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/conversations/:id — usuń konwersację
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Conversation.deleteOne({ _id: req.params.id, userId: req.session.userId });
    res.json({ message: 'Deleted.' });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
