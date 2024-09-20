// Load environment variables
require('dotenv').config();

const aiConfig = {
  // AI API base URL
  apiBaseUrl: process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',

  // API key for authenticating with AI services
  apiKey: process.env.AI_API_KEY,

  // Model parameters
  model: {
    name: process.env.AI_MODEL_NAME || 'gpt-4o',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 150,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
  },

  // Request settings
  request: {
    timeout: parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000, // 30 seconds
    retries: parseInt(process.env.AI_REQUEST_RETRIES) || 3,
  },

  // Endpoints
  endpoints: {
    chat: '/chat/completions',
    analyze: '/audio/analyze',
  },

  // Function to validate the configuration
  validate: function() {
    if (!this.apiKey) {
      throw new Error('AI API key is not set. Please set the AI_API_KEY environment variable.');
    }
    // Add more validation as needed
  }
};

// Validate the configuration
aiConfig.validate();

module.exports = aiConfig;