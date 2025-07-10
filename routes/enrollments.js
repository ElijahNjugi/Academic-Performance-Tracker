const express = require('express');
const router = express.Router();
const pool = require('../db');

// Enroll a student in a course
router.post('/enroll', async (req, res) => {
  const { user_id, course_id } = req.body;

  try {
    // Step 1: Get student_id from user_id
    const studentRes = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [user_id]
    );
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = studentRes.rows[0].id;

    // Step 2: Check if already enrolled
    const checkRes = await pool.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [student_id, course_id]
    );
    if (checkRes.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled' });
    }

    // Step 3: Insert into enrollments
    const result = await pool.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING *',
      [student_id, course_id]
    );

    res.status(201).json({ message: 'Enrolled successfully', enrollment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

// Get all enrolled students for a course
router.get('/course/:course_id', async (req, res) => {
  const { course_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        e.id AS enrollment_id,
        s.id AS student_id,
        s.reg_no,
        s.full_name,
        g.grade,
        g.remarks,
        c.credit_hours,
        COALESCE(SUM(a.duration) FILTER (WHERE a.status = 'Present'), 0) AS attended
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN grades g ON e.id = g.enrollment_id
      LEFT JOIN attendance a ON e.id = a.enrollment_id
      JOIN courses c ON e.course_id = c.id
      WHERE e.course_id = $1
      GROUP BY e.id, s.id, g.grade, g.remarks, c.credit_hours
    `, [course_id]);

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    const formatted = result.rows.map(r => {
      const expected = r.credit_hours * 14;
      const percent = expected > 0 ? Math.round((r.attended / expected) * 100) : 0;
      const grade = r.grade || 'F'; // Default to F if no grade

      // Increment grade count
      if (['A', 'B', 'C', 'D', 'F'].includes(grade)) {
        gradeCounts[grade]++;
      }

      return {
        ...r,
        attendance_percent: percent
      };
    });

    res.json({ students: formatted, gradeCounts });

  } catch (err) {
    console.error("❌ SQL ERROR @ /course/:id", err);
    res.status(500).json({ error: 'Failed to fetch students in course' });
  }
});

// GET all enrolled students for a course - Plain for Lecturers
router.get('/plain/course/:course_id', async (req, res) => {
  const { course_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        e.id AS enrollment_id,
        s.id AS student_id,
        s.reg_no,
        s.full_name,
        g.grade,
        g.remarks,
        c.credit_hours,
        COALESCE(SUM(a.duration) FILTER (WHERE a.status = 'Present'), 0) AS attended
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN grades g ON e.id = g.enrollment_id
      LEFT JOIN attendance a ON e.id = a.enrollment_id
      JOIN courses c ON e.course_id = c.id
      WHERE e.course_id = $1
      GROUP BY e.id, s.id, g.grade, g.remarks, c.credit_hours
    `, [course_id]);

    const formatted = result.rows.map(r => {
      const expected = r.credit_hours * 14;
      const percent = expected > 0 ? Math.round((r.attended / expected) * 100) : 0;

      return {
        ...r,
        attendance_percent: percent
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("❌ SQL ERROR @ /plain/course/:id", err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

module.exports = router;
