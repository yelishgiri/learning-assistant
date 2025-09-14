const fileController = require('../controllers/fileController');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const fileRouter = Router();

// Study material upload route
fileRouter.post('/upload', requireAuth, fileController.uploadFile);

// File download route
fileRouter.get('/:id/download', requireAuth, fileController.downloadFile);

// File delete route
fileRouter.post('/:id/delete', requireAuth, fileController.deleteFile);

// File share route
fileRouter.post('/:id/share', requireAuth, fileController.shareFile);

module.exports = fileRouter;
