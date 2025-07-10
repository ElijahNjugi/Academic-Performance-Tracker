const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/create', async (req, res) => {
  const { course_code, course_name, credit_hours, year, semester, lecturer_id, department } = req.body;

if (!department) {
  return res.status(400).json({ error: 'Department is required' });
}

  try {
    const result = await pool.query(
      'INSERT INTO courses (course_code, course_name, credit_hours, year, semester, lecturer_id, department) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [course_code, course_name, credit_hours, year, semester, lecturer_id, department]
    );
    res.status(201).json({ message: 'Course created', course: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Course creation failed' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY year, semester, course_code');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get all courses assigned to a specific lecturer
router.get('/lecturer/:lecturer_id', async (req, res) => {
  const { lecturer_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE lecturer_id = $1 ORDER BY year, semester',
      [lecturer_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses for lecturer' });
  }
});

//This fetches all courses taught by lecturers in that department.
router.get('/by-department/:department', async (req, res) => {
  const { department } = req.params;

  try {
    const result = await pool.query(`
      SELECT courses.* 
      FROM courses
      JOIN lecturers ON courses.lecturer_id = lecturers.id
      WHERE lecturers.department = $1
    `, [department]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch department courses' });
  }
});

// Get available courses for a student (not yet enrolled)
router.get('/available/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // 1️⃣ Find student info
    const studentRes = await pool.query(
      'SELECT id, year, semester, department FROM students WHERE user_id = $1',
      [user_id]
    );

    if (studentRes.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    const student = studentRes.rows[0];

    // 2️⃣ Get all courses for year, semester, and department
    const allCourses = await pool.query(
      'SELECT * FROM courses WHERE year = $1 AND semester = $2 AND department = $3',
      [student.year, student.semester, student.department]
    );

    // 3️⃣ Get course_ids student already enrolled in
    const enrolled = await pool.query(
      'SELECT course_id FROM enrollments WHERE student_id = $1',
      [student.id]
    );
    const enrolledIds = enrolled.rows.map(row => row.course_id);

    // 4️⃣ Filter out enrolled
    const available = allCourses.rows.filter(course => !enrolledIds.includes(course.id));

    res.json(available);
  } catch (err) {
    console.error('❌ Failed to load available courses', err);
    res.status(500).json({ error: 'Failed to load available courses' });
  }
});

// Get courses student is enrolled in
router.get('/enrolled/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT c.id, c.course_code, c.course_name, c.year, c.semester
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      WHERE s.user_id = $1
    `, [user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch enrolled courses', err);
    res.status(500).json({ error: 'Could not fetch enrolled courses' });
  }
});

module.exports = router;
