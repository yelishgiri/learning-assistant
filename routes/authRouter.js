const { Router } = require('express');
const authController = require('../controllers/authController');
const authRouter = Router();

authRouter.get('/sign-up', authController.signUpFormGet);
authRouter.post('/sign-up', authController.signUpFormPost);

authRouter.get('/log-in', authController.logInFormGet);
authRouter.post('/log-in', authController.logInFormPost);


module.exports = authRouter;