const express = require('express');
const router = express.Router();
const pool = require('../db');

// 📌 Post new resource
router.post('/post', async (req, res) => {
  const { posted_by, target_course_id, target_department, title, message } = req.body;

  try {
    await pool.query(`
      INSERT INTO resources (posted_by, target_course_id, target_department, title, message)
      VALUES ($1, $2, $3, $4, $5)
    `, [posted_by, target_course_id || null, target_department || null, title, message]);

    res.json({ message: '✅ Announcement posted successfully!' });
  } catch (err) {
    console.error('❌ Failed to post resource', err);
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

router.post('/fetch', async (req, res) => {
  const { department, course_ids } = req.body;

  try {
    const result = await pool.query(`
      SELECT r.*, u.email AS posted_by_email
      FROM resources r
      JOIN users u ON r.posted_by = u.id
      WHERE 
        (r.target_department = $1 OR r.target_course_id = ANY($2::int[]))
      ORDER BY r.timestamp DESC
    `, [department, course_ids]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch resources', err);
    res.status(500).json({ error: 'Could not fetch updates' });
  }
});

module.exports = router;