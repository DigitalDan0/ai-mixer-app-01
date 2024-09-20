const axios = require('axios');
const logger = require('../utils/logger');
const aiConfig = require('../config/aiConfig');

class AIService {
  constructor() {
    this.apiUrl = aiConfig.apiUrl;
    this.apiKey = aiConfig.apiKey;
  }

  async analyzeTracks(tracksData) {
    try {
      const response = await axios.post(`${this.apiUrl}/analyze`, tracksData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.suggestions;
    } catch (error) {
      logger.error('Error in analyzeTracks:', error);
      throw new Error('Failed to analyze tracks and generate suggestions');
    }
  }

  async processChatQuery(query, context) {
    try {
      const response = await axios.post(`${this.apiUrl}/chat`, {
        query,
        context
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.response;
    } catch (error) {
      logger.error('Error in processChatQuery:', error);
      throw new Error('Failed to process chat query');
    }
  }

  applySuggestions(suggestions, tracks) {
    return tracks.map(track => {
      const trackSuggestions = suggestions.find(s => s.trackId === track.id);
      if (trackSuggestions) {
        return {
          ...track,
          volume: trackSuggestions.volume || track.volume,
          pan: trackSuggestions.pan || track.pan,
          effects: {
            ...track.effects,
            ...trackSuggestions.effects
          }
        };
      }
      return track;
    });
  }

  async generateMixingSuggestions(trackData) {
    try {
      // Prepare data for AI analysis
      const projectContext = {
        tracks: trackData,
        // Add any other relevant project information
      };

      // Send data to AI for analysis
      const suggestions = await this.analyzeTracks(projectContext);

      // Process and format suggestions
      const formattedSuggestions = suggestions.map(suggestion => ({
        trackId: suggestion.trackId,
        volume: suggestion.volume,
        pan: suggestion.pan,
        effects: suggestion.effects,
        explanation: suggestion.explanation
      }));

      return formattedSuggestions;
    } catch (error) {
      logger.error('Error in generateMixingSuggestions:', error);
      throw new Error('Failed to generate mixing suggestions');
    }
  }
}

module.exports = new AIService();