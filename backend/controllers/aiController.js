const Track = require('../models/Track');
const aiService = require('../services/aiService');
const audioProcessingService = require('../services/audioProcessingService');
const logger = require('../utils/logger');

const aiController = {
  // Fetch AI-generated mixing/mastering suggestions
  async getAISuggestions(req, res) {
    try {
      // Fetch all tracks for the current project
      const tracks = await Track.find({ projectId: req.params.projectId });
      
      if (tracks.length === 0) {
        return res.status(404).json({ message: 'No tracks found for this project' });
      }

      // Prepare track data for AI analysis
      const trackData = tracks.map(track => ({
        id: track._id,
        name: track.name,
        volume: track.volume,
        pan: track.pan,
        effects: track.effects,
        // Add other relevant track data
      }));

      // Get AI suggestions
      const suggestions = await aiService.generateMixingSuggestions(trackData);

      res.json(suggestions);
    } catch (error) {
      logger.error('Error in getAISuggestions:', error);
      res.status(500).json({ message: 'Error fetching AI suggestions', error: error.message });
    }
  },

  // Apply selected AI suggestions to tracks
  async applyAISuggestions(req, res) {
    try {
      const { projectId, suggestions } = req.body;

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return res.status(400).json({ message: 'Invalid suggestions data' });
      }

      const updatedTracks = [];

      for (const suggestion of suggestions) {
        const track = await Track.findOne({ _id: suggestion.trackId, projectId });

        if (!track) {
          logger.warn(`Track not found: ${suggestion.trackId}`);
          continue;
        }

        // Apply suggestions to track
        if (suggestion.volume !== undefined) track.volume = suggestion.volume;
        if (suggestion.pan !== undefined) track.pan = suggestion.pan;
        if (suggestion.effects) track.effects = { ...track.effects, ...suggestion.effects };

        // Save updated track
        await track.save();
        updatedTracks.push(track);

        // Apply audio processing if needed
        if (suggestion.audioProcessing) {
          await audioProcessingService.applyProcessing(track._id, suggestion.audioProcessing);
        }
      }

      res.json({ message: 'AI suggestions applied successfully', updatedTracks });
    } catch (error) {
      logger.error('Error in applyAISuggestions:', error);
      res.status(500).json({ message: 'Error applying AI suggestions', error: error.message });
    }
  },

  // Handle user queries and return AI responses
  async chatWithAI(req, res) {
    try {
      const { projectId, message } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      // Fetch project context (e.g., tracks, current mix state)
      const tracks = await Track.find({ projectId });
      const projectContext = {
        tracks: tracks.map(track => ({
          id: track._id,
          name: track.name,
          volume: track.volume,
          pan: track.pan,
          effects: track.effects,
        })),
        // Add other relevant project data
      };

      // Process the query through AI service
      const aiResponse = await aiService.processChat(message, projectContext);

      res.json({ response: aiResponse });
    } catch (error) {
      logger.error('Error in chatWithAI:', error);
      res.status(500).json({ message: 'Error processing AI chat', error: error.message });
    }
  }
};

module.exports = aiController;