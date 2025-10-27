const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// All routes require admin authentication
router.use(auth, adminAuth);

// Get all records
router.get('/records', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.query(
    `SELECT r.*, u.first_name, u.last_name, u.email 
     FROM records r 
     JOIN users u ON r.user_id = u.id 
     ORDER BY r.created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (error, results) => {
      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database error' 
        });
      }

      // Get total count
      db.query(
        'SELECT COUNT(*) as total FROM records',
        (error, countResults) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Database error' 
            });
          }

          res.json({
            status: 'success',
            data: {
              records: results,
              pagination: {
                page,
                limit,
                total: countResults[0].total,
                pages: Math.ceil(countResults[0].total / limit)
              }
            }
          });
        }
      );
    }
  );
});

// Update record status
router.patch('/records/:id/status', (req, res) => {
  const recordId = req.params.id;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['under-investigation', 'rejected', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Invalid status. Must be under-investigation, rejected, or resolved' 
    });
  }

  // Check if record exists
  db.query(
    `SELECT r.*, u.email, u.first_name 
     FROM records r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.id = ?`,
    [recordId],
    (error, results) => {
      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database error' 
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Record not found' 
        });
      }

      const record = results[0];

      // Update status
      db.query(
        'UPDATE records SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, recordId],
        (error) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Error updating status' 
            });
          }

          // Here you would typically send email/SMS notifications
          // For now, we'll just log it
          console.log(`Status updated for record ${recordId}. Would send notification to ${record.email}`);

          res.json({
            status: 'success',
            message: 'Record status updated successfully'
          });
        }
      );
    }
  );
});

// Get statistics
router.get('/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_users FROM users',
    'SELECT COUNT(*) as total_records FROM records',
    'SELECT type, COUNT(*) as count FROM records GROUP BY type',
    'SELECT status, COUNT(*) as count FROM records GROUP BY status'
  ];

  Promise.all(
    queries.map(query => {
      return new Promise((resolve, reject) => {
        db.query(query, (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
    })
  )
  .then(results => {
    res.json({
      status: 'success',
      data: {
        totalUsers: results[0][0].total_users,
        totalRecords: results[1][0].total_records,
        recordsByType: results[2],
        recordsByStatus: results[3]
      }
    });
  })
  .catch(error => {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error fetching statistics' 
    });
  });
});

module.exports = router;