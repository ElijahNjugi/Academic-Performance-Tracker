const express = require('express');
const router = express.Router();
const pool = require('../db');

// Save grade for a student's enrollment
router.post('/record', async (req, res) => {
  const { enrollment_id, score, remarks } = req.body;

  // Simple grading scale
  let grade = 'F';
  if (score >= 70) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 40) grade = 'D';

  try {
    const result = await pool.query(`
      INSERT INTO grades (enrollment_id, score, grade, remarks)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (enrollment_id) DO UPDATE
      SET score = $2, grade = $3, remarks = $4
      RETURNING *
    `, [enrollment_id, score, grade, remarks]);

    res.json({ message: 'Grade recorded', grade: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record grade' });
  }
});

// GET: Class performance summary
router.get('/class/:course_id', async (req, res) => {
  const { course_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT s.full_name, s.reg_no, g.grade, 
        ROUND(
          (COUNT(a.*) FILTER (WHERE a.status = 'Present')::decimal 
          / NULLIF(COUNT(a.*),0)) * 100, 1
        ) AS attendance_percent
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN grades g ON g.enrollment_id = e.id
      LEFT JOIN attendance a ON a.enrollment_id = e.id
      WHERE e.course_id = $1
      GROUP BY s.id, g.grade
      ORDER BY s.full_name;
    `, [course_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch class performance', err);
    res.status(500).json({ error: '❌ Failed to fetch class performance' });
  }
});

module.exports = router;
