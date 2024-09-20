const express = require('express');
const router = express.Router();
const aiController = require('../Controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have authentication middleware

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/ai/suggestions - Fetch AI-generated suggestions
router.post('/suggestions', aiController.getAISuggestions);

// POST /api/ai/apply - Apply AI adjustments
router.post('/apply', aiController.applyAISuggestions);

// POST /api/ai/chat - Handle chat-based interactions with AI assistant
router.post('/chat', aiController.chatWithAI);

module.exports = router;