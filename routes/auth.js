const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, firstName, lastName, email, birthDate } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Użytkownik o tym loginie już istnieje.' });
    const user = new User({ username, password, firstName, lastName, email, birthDate });
    await user.save();
    res.status(201).json({ message: 'User created.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Podaj login i hasło.' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'To konto nie istnieje.' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Hasło jest nieprawidłowe.' });

    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ message: 'Logged in.', username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out.' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.json({ username: req.session.username });
});

module.exports = router;
