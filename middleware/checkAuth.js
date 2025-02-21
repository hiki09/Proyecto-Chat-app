const auth = require('./auth');

const checkAuth = (req, res, next) => {
    if (req.path === '/chat.html') {
        return auth(req, res, () => {
            next();
        });
    }
    next();
};

module.exports = checkAuth; 