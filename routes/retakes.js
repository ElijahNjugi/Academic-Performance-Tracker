const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ Submit a new request
router.post('/apply', async (req, res) => {
  const { enrollment_id, type, reason } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO retake_resit_requests (enrollment_id, type, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [enrollment_id, type, reason]
    );

    res.status(201).json({ message: 'Application submitted', request: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ✅ Get all requests for a student
router.get('/student/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const studentRes = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [user_id]
    );
    const student_id = studentRes.rows[0]?.id;
    if (!student_id) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT r.id, r.type, r.reason, r.status, r.requested_at,
             c.course_code, c.course_name
      FROM retake_resit_requests r
      JOIN enrollments e ON r.enrollment_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1
      ORDER BY r.requested_at DESC
    `, [student_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student requests' });
  }
});

// ✅ Course Admin fetches all requests in their department
router.get('/department/:department', async (req, res) => {
  const { department } = req.params;

  try {
    const result = await pool.query(`
      SELECT r.id, r.status, r.type, r.reason, r.requested_at,
             r.enrollment_id, s.full_name, s.reg_no,
             c.course_code, c.course_name
      FROM retake_resit_requests r
      JOIN enrollments e ON r.enrollment_id = e.id
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      JOIN lecturers l ON c.lecturer_id = l.id
      WHERE l.department = $1
      ORDER BY r.requested_at DESC
    `, [department]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch department requests' });
  }
});

// ✅ Update request status (approve/reject)
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      `UPDATE retake_resit_requests
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );

    res.json({ message: `Request ${id} updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

module.exports = router;
