const summaryController = require('../controllers/summaryController');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const summaryRouter = Router();

// POST: generate summary for a file
summaryRouter.post('/:id/summary', requireAuth, summaryController.generateSummary);

// GET: view full summary for a file
summaryRouter.get('/:id/summary', requireAuth, summaryController.getSummary);

module.exports = summaryRouter;
