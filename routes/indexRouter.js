const { Router } = require('express');
const indexController = require('../controllers/indexController');
const { requireAuth } = require('../middleware/auth');
const indexRouter = Router();

indexRouter.get('/', indexController.getIndex);
indexRouter.get('/dashboard', requireAuth, indexController.getDashboard);


module.exports = indexRouter