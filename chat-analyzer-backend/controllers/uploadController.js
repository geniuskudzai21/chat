const ChatFile = require('../models/ChatFile');
const fs = require('fs');
const path = require('path');

// Upload chat file
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create file record in database
    const chatFile = new ChatFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    await chatFile.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: chatFile._id,
        filename: chatFile.originalName,
        uploadDate: chatFile.uploadDate
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// Get all uploaded files
const getFiles = async (req, res) => {
  try {
    const files = await ChatFile.find()
      .sort({ uploadDate: -1 })
      .select('filename originalName fileSize uploadDate analysisStatus');

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files',
      error: error.message
    });
  }
};

// Get single file by ID
const getFileById = async (req, res) => {
  try {
    const file = await ChatFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file',
      error: error.message
    });
  }
};

// Update analysis result
const updateAnalysis = async (req, res) => {
  try {
    const { analysisResult, status } = req.body;
    
    const file = await ChatFile.findByIdAndUpdate(
      req.params.id,
      {
        analysisStatus: status || 'completed',
        analysisResult: analysisResult
      },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'Analysis updated successfully',
      data: file
    });
  } catch (error) {
    console.error('Update analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating analysis',
      error: error.message
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await ChatFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete database record
    await ChatFile.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  getFileById,
  updateAnalysis,
  deleteFile
};

