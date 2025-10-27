const express = require('express');
const { auth } = require('../middleware/auth');
const { validateRecord } = require('../middleware/validation');
const db = require('../config/database');

const router = express.Router();

// All routes are protected
router.use(auth);

// Get all records for logged in user
router.get('/', (req, res) => {
  db.query(
    `SELECT id, type, title, description, latitude, longitude, status, 
            images, videos, created_at, updated_at 
     FROM records 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [req.user.id],
    (error, results) => {
      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database error' 
        });
      }

      res.json({
        status: 'success',
        data: results
      });
    }
  );
});

// Get single record
router.get('/:id', (req, res) => {
  const recordId = req.params.id;

  db.query(
    `SELECT id, type, title, description, latitude, longitude, status, 
            images, videos, created_at, updated_at 
     FROM records 
     WHERE id = ? AND user_id = ?`,
    [recordId, req.user.id],
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

      res.json({
        status: 'success',
        data: results[0]
      });
    }
  );
});

// Create new record
router.post('/', validateRecord, (req, res) => {
  const { type, title, description, latitude, longitude, images, videos } = req.body;

  db.query(
    `INSERT INTO records (user_id, type, title, description, latitude, longitude, images, videos) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, type, title, description, latitude, longitude, 
     JSON.stringify(images || []), JSON.stringify(videos || [])],
    (error, results) => {
      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Error creating record' 
        });
      }

      // Fetch the created record
      db.query(
        'SELECT * FROM records WHERE id = ?',
        [results.insertId],
        (error, recordResults) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Error fetching created record' 
            });
          }

          res.status(201).json({
            status: 'success',
            message: 'Record created successfully',
            data: recordResults[0]
          });
        }
      );
    }
  );
});

// Update record
router.put('/:id', validateRecord, (req, res) => {
  const recordId = req.params.id;
  const { type, title, description, latitude, longitude, images, videos } = req.body;

  // Check if record exists and belongs to user
  db.query(
    'SELECT id, status FROM records WHERE id = ? AND user_id = ?',
    [recordId, req.user.id],
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

      // Check if record can be edited (status is draft)
      if (record.status !== 'draft') {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Cannot edit record that is under investigation, rejected, or resolved' 
        });
      }

      // Update record
      db.query(
        `UPDATE records 
         SET type = ?, title = ?, description = ?, latitude = ?, longitude = ?, 
             images = ?, videos = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [type, title, description, latitude, longitude, 
         JSON.stringify(images || []), JSON.stringify(videos || []), recordId],
        (error) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Error updating record' 
            });
          }

          // Fetch updated record
          db.query(
            'SELECT * FROM records WHERE id = ?',
            [recordId],
            (error, updateResults) => {
              if (error) {
                return res.status(500).json({ 
                  status: 'error', 
                  message: 'Error fetching updated record' 
                });
              }

              res.json({
                status: 'success',
                message: 'Record updated successfully',
                data: updateResults[0]
              });
            }
          );
        }
      );
    }
  );
});

// Update record location
router.patch('/:id/location', (req, res) => {
  const recordId = req.params.id;
  const { latitude, longitude } = req.body;

  // Check if record exists and belongs to user
  db.query(
    'SELECT id, status FROM records WHERE id = ? AND user_id = ?',
    [recordId, req.user.id],
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

      // Check if record location can be changed (status is draft)
      if (record.status !== 'draft') {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Cannot change location of record that is under investigation, rejected, or resolved' 
        });
      }

      // Update location
      db.query(
        'UPDATE records SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [latitude, longitude, recordId],
        (error) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Error updating location' 
            });
          }

          res.json({
            status: 'success',
            message: 'Record location updated successfully'
          });
        }
      );
    }
  );
});

// Delete record
router.delete('/:id', (req, res) => {
  const recordId = req.params.id;

  // Check if record exists and belongs to user
  db.query(
    'SELECT id, status FROM records WHERE id = ? AND user_id = ?',
    [recordId, req.user.id],
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

      // Check if record can be deleted (status is draft)
      if (record.status !== 'draft') {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Cannot delete record that is under investigation, rejected, or resolved' 
        });
      }

      // Delete record
      db.query(
        'DELETE FROM records WHERE id = ?',
        [recordId],
        (error) => {
          if (error) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'Error deleting record' 
            });
          }

          res.json({
            status: 'success',
            message: 'Record deleted successfully'
          });
        }
      );
    }
  );
});

module.exports = router;