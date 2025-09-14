const { Router } = require('express');
const indexController = require('../controllers/indexController');
const indexRouter = Router();

indexRouter.get('/', indexController.getIndex);
indexRouter.get('/dashboard', indexController.getDashboard);


module.exports = indexRouter