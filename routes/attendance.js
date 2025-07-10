const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST: Mark attendance with duration
router.post('/mark', async (req, res) => {
  const { enrollment_id, date, status, duration } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO attendance (enrollment_id, date, status, duration)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (enrollment_id, date) DO UPDATE
       SET status = EXCLUDED.status,
           duration = EXCLUDED.duration
       RETURNING *`,
      [enrollment_id, date, status, duration]
    );

    res.json({ message: '✅ Attendance marked', record: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to mark attendance' });
  }
});

// GET: Course attendance (for viewing history if needed)
router.get('/course/:course_id', async (req, res) => {
  const { course_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT a.*, s.full_name, s.reg_no
      FROM attendance a
      JOIN enrollments e ON a.enrollment_id = e.id
      JOIN students s ON e.student_id = s.id
      WHERE e.course_id = $1
      ORDER BY a.date DESC
    `, [course_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch course attendance' });
  }
});

// GET: Attendance summary for a student
router.get('/student/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const studentResult = await pool.query(
      'SELECT id, year, semester FROM students WHERE user_id = $1',
      [user_id]
    );
    if (studentResult.rows.length === 0)
      return res.status(404).json({ message: 'Student not found' });

    const { id: student_id, year, semester } = studentResult.rows[0];

    const result = await pool.query(`
      SELECT c.course_code, c.course_name, c.id AS course_id,
        c.credit_hours,
        COUNT(a.*) FILTER (WHERE a.status = 'Present') AS attended,
        COUNT(a.*) FILTER (WHERE a.status IS NOT NULL) AS total
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN attendance a ON a.enrollment_id = e.id
      WHERE e.student_id = $1
        AND c.year = $2 AND c.semester = $3
      GROUP BY c.id
      ORDER BY c.course_code;
    `, [student_id, year, semester]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch student attendance' });
  }
});

// GET: Attendance logs (alias for existing course attendance route)
router.get('/logs/:course_id', async (req, res) => {
  const { course_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.*, s.full_name, s.reg_no
      FROM attendance a
      JOIN enrollments e ON a.enrollment_id = e.id
      JOIN students s ON e.student_id = s.id
      WHERE e.course_id = $1
      ORDER BY a.date DESC
    `, [course_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch attendance logs', err);
    res.status(500).json({ error: '❌ Failed to fetch attendance logs' });
  }
});

module.exports = router;
