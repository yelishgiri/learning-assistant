const passport = require('passport');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

const signUpFormGet = async (req,res) => {
    res.render('auth/sign-up');
}

const signUpFormPost = async (req,res) => {
    const { user_username, user_email, user_first_name, user_last_name, user_password } = req.body;
    await prisma.user.create({
        data: {
            username: user_username,
            first_name: user_first_name,
            last_name: user_last_name,
            email: user_email,
            password: await bcrypt.hash(user_password, 10),
        }
    })
    res.redirect('auth/log-in');
}

const logInFormGet = async (req,res) => {
    res.render('auth/log-in');
}

const logInFormPost = async (req,res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: 'auth/log-in'
    })(req, res, next);
}


module.exports = { signUpFormGet, signUpFormPost, logInFormGet, logInFormPost};