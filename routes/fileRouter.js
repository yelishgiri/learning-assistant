const fileController = require('../controllers/fileController');
const { Router } = require('express');
const fileRouter = Router();

// Study material upload route
fileRouter.post('/upload', fileController.uploadFile);

// File download route
fileRouter.get('/:id/download', fileController.downloadFile);

// File delete route
fileRouter.post('/:id/delete', fileController.deleteFile);

// File share route
fileRouter.post('/:id/share', fileController.shareFile);

module.exports = fileRouter;
