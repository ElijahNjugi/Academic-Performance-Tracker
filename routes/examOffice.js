const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/grades/:course_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.full_name, s.reg_no, g.*
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN students s ON e.student_id = s.id
      WHERE e.course_id = $1
    `, [req.params.course_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch grades' });
  }
});

router.put('/approve/:course_id', async (req, res) => {
  try {
    await pool.query(`
      UPDATE grades SET finalized = TRUE
      FROM enrollments e
      WHERE grades.enrollment_id = e.id AND e.course_id = $1
    `, [req.params.course_id]);
    res.json({ message: '✅ Grades finalized' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to finalize grades' });
  }
});

router.get('/records/:course_id', async (req, res) => {
  const { course_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT s.full_name, s.reg_no, g.grade, g.score, g.remarks
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN grades g ON g.enrollment_id = e.id
      WHERE e.course_id = $1
      ORDER BY s.full_name
    `, [course_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch exam office records' });
  }
});

module.exports = router;
