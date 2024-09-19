const Track = require('../models/Track');
const audioProcessingService = require('../services/audioProcessingService');
const logger = require('../utils/logger');

// Maximum file size (in bytes) - 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed audio file formats
const ALLOWED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

const trackController = {
  // Handle file uploads, save track metadata, and initiate waveform processing
  async uploadTrack(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Validate file size
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ message: 'File size exceeds the limit of 50MB' });
      }

      // Validate file format
      if (!ALLOWED_FORMATS.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file format. Allowed formats: MP3, WAV, OGG' });
      }

      // Create new track in database
      const newTrack = new Track({
        name: req.body.name || req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        duration: 0, // Will be updated after processing
        userId: req.user.id // Assuming user authentication is implemented
      });

      const savedTrack = await newTrack.save();

      // Initiate waveform processing
      audioProcessingService.generateWaveform(savedTrack._id, req.file.path);

      res.status(201).json(savedTrack);
    } catch (error) {
      logger.error('Error in uploadTrack:', error);
      res.status(500).json({ message: 'Error uploading track', error: error.message });
    }
  },

  // Retrieve a list of all uploaded tracks
  async getTracks(req, res) {
    try {
      const tracks = await Track.find({ userId: req.user.id });
      res.json(tracks);
    } catch (error) {
      logger.error('Error in getTracks:', error);
      res.status(500).json({ message: 'Error fetching tracks', error: error.message });
    }
  },

  // Fetch details of a specific track by ID
  async getTrackById(req, res) {
    try {
      const track = await Track.findOne({ _id: req.params.id, userId: req.user.id });
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }
      res.json(track);
    } catch (error) {
      logger.error('Error in getTrackById:', error);
      res.status(500).json({ message: 'Error fetching track', error: error.message });
    }
  },

  // Delete a track and its associated data
  async deleteTrack(req, res) {
    try {
      const track = await Track.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }
      // Delete associated file
      await audioProcessingService.deleteAudioFile(track.filePath);
      res.json({ message: 'Track deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteTrack:', error);
      res.status(500).json({ message: 'Error deleting track', error: error.message });
    }
  },

  // Update track metadata or settings
  async updateTrack(req, res) {
    try {
      const allowedUpdates = ['name', 'volume', 'pan', 'effects'];
      const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
      
      if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid updates provided' });
      }

      const track = await Track.findOne({ _id: req.params.id, userId: req.user.id });
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }

      updates.forEach(update => track[update] = req.body[update]);
      await track.save();

      res.json(track);
    } catch (error) {
      logger.error('Error in updateTrack:', error);
      res.status(500).json({ message: 'Error updating track', error: error.message });
    }
  }
};

module.exports = trackController;