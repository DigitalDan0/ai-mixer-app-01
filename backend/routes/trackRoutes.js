const express = require('express');
const router = express.Router();
const trackController = require('../Controllers/trackController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// POST /api/tracks/upload - Upload a new track
router.post('/upload', upload.single('audioFile'), trackController.uploadTrack);

// GET /api/tracks - Retrieve all tracks
router.get('/', trackController.getTracks);

// GET /api/tracks/:id - Fetch a specific track
router.get('/:id', trackController.getTrackById);

// DELETE /api/tracks/:id - Delete a track
router.delete('/:id', trackController.deleteTrack);

// PUT /api/tracks/:id - Update track details
router.put('/:id', trackController.updateTrack);

module.exports = router;