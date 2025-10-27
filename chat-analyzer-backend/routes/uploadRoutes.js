const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadFile,
  getFiles,
  getFileById,
  updateAnalysis,
  deleteFile
} = require('../controllers/uploadController');

// Upload route
router.post('/upload', upload.single('chatFile'), uploadFile);

// Get all files
router.get('/files', getFiles);

// Get single file
router.get('/files/:id', getFileById);

// Update analysis
router.put('/files/:id/analysis', updateAnalysis);

// Delete file
router.delete('/files/:id', deleteFile);

module.exports = router;

