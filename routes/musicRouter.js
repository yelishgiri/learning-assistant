const musicController = require('../controllers/musicController');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const musicRouter = Router();

// POST: Generate music for a folder
musicRouter.post('/:id/generate', requireAuth, musicController.generateMusic);

// GET: Check music generation status
musicRouter.get('/:id/status', requireAuth, musicController.getMusicStatus);

// GET: Get current music for a folder
musicRouter.get('/:id/music', requireAuth, musicController.getFolderMusic);

module.exports = musicRouter;
