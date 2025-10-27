const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Register user
router.post('/register', validateUserRegistration, (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user exists
  db.query('SELECT id FROM users WHERE email = ?', [email], async (error, results) => {
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database error' 
      });
    }

    if (results.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User already exists' 
      });
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      db.query(
        'INSERT INTO users (first_name, last_name, email, password, phone) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword, phone],
        (error, results) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Error creating user' 
            });
          }

          // Generate token
          const token = jwt.sign(
            { userId: results.insertId }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
          );

          res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
              token,
              user: {
                id: results.insertId,
                firstName,
                lastName,
                email,
                phone
              }
            }
          });
        }
      );
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Server error' 
      });
    }
  });
});

// Login user
router.post('/login', validateUserLogin, (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT id, first_name, last_name, email, password, phone, is_admin FROM users WHERE email = ?',
    [email],
    async (error, results) => {
      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database error' 
        });
      }

      if (results.length === 0) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        });
      }

      const user = results[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            isAdmin: Boolean(user.is_admin)
          }
        }
      });
    }
  );
});

module.exports = router;