const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    db.query(
      'SELECT id, first_name, last_name, email, is_admin FROM users WHERE id = ?',
      [decoded.userId],
      (error, results) => {
        if (error || results.length === 0) {
          return res.status(401).json({ 
            status: 'error', 
            message: 'Token is not valid' 
          });
        }
        
        req.user = results[0];
        next();
      }
    );
  } catch (error) {
    res.status(401).json({ 
      status: 'error', 
      message: 'Token is not valid' 
    });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

module.exports = { auth, adminAuth };