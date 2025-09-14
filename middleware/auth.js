// Authentication middleware to protect routes
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/log-in');
};

module.exports = { requireAuth };
