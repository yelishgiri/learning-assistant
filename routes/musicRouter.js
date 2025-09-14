const musicController = require('../controllers/musicController');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const musicRouter = Router();

// POST: Generate music for a folder
musicRouter.post('/:id/generate', requireAuth, musicController.generateMusic);

// POST: Regenerate music for a folder
musicRouter.post('/:id/regenerate', requireAuth, musicController.regenerateMusic);

// GET: Check music generation status
musicRouter.get('/:id/status', requireAuth, musicController.getMusicStatus);

// GET: Get current music for a folder
musicRouter.get('/:id/music', requireAuth, musicController.getFolderMusic);

// POST: Skip to next track
musicRouter.post('/:id/skip-next', requireAuth, musicController.skipNext);

// POST: Skip to previous track
musicRouter.post('/:id/skip-previous', requireAuth, musicController.skipPrevious);

// GET: Get current track from queue
musicRouter.get('/:id/current-track', requireAuth, musicController.getCurrentTrack);

module.exports = musicRouter;
