const express = require('express');
const multer = require('multer');
const File = require('../models/File');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { originalname, buffer } = req.file;
    const content = buffer.toString('utf-8');
    const file = new File({ filename: originalname, content });
    await file.save();
    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all files
router.get('/', async (req, res) => {
  try {
    const files = await File.find({}, 'filename uploadedAt');
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a specific file
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

module.exports = router;
