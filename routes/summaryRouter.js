const summaryController = require('../controllers/summaryController');
const { Router } = require('express');
const summaryRouter = Router();

// POST: generate summary for a file
summaryRouter.post('/:id/summary', summaryController.generateSummary);

// GET: view full summary for a file
summaryRouter.get('/:id/summary', summaryController.getSummary);

module.exports = summaryRouter;
