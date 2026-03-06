const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:  { type: String, default: 'Nowy czat' },
  messages: [messageSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
