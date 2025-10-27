const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  content: String,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);
