const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/create-user', async (req, res) => {
  const { email, password, reg_no, full_name, year, semester, department } = req.body;

  if (!department) {
    return res.status(400).json({ error: 'Department is required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    // 1. Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
      [email, hashed, 'student']
    );

    const user = userResult.rows[0];

    // 2. Create student profile
    const studentResult = await pool.query(
      'INSERT INTO students (user_id, reg_no, full_name, year, semester, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.id, reg_no, full_name, year, semester, department]
    );

    const student = studentResult.rows[0];

    res.status(201).json({ message: 'Student user created', user, student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create student user' });
  }
});

// Get student info by user_id
router.get('/by-user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT full_name, reg_no, year, semester, phone, guardian_name, guardian_contact, department, religion
      FROM students
      WHERE user_id = $1
    `, [user_id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student info' });
  }
});

// Get student grades + course info by user_id
router.get('/grades/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Step 1: Find student ID
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [user_id]
    );
    if (studentResult.rows.length === 0)
      return res.status(404).json({ message: 'Student not found' });

    const student_id = studentResult.rows[0].id;

    // Step 2: Join enrollments → grades → courses
    // Step 2: Join enrollments → grades → courses
const gradesResult = await pool.query(`
  SELECT 
    e.id AS enrollment_id,
    c.course_code,
    c.course_name,
    c.credit_hours,
    g.score,
    g.grade,
    g.remarks
  FROM enrollments e
  JOIN grades g ON e.id = g.enrollment_id
  JOIN courses c ON e.course_id = c.id
  WHERE e.student_id = $1
  ORDER BY c.year, c.semester;
`, [student_id]);

    res.json(gradesResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// 📍 GET degree progression for student
router.get('/degree-progression/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Step 1: Get student ID
    const studentRes = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [user_id]
    );
    if (studentRes.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    const student_id = studentRes.rows[0].id;

    // Step 2: Get grades and credit hours
    const gradeData = await pool.query(`
      SELECT g.grade, c.credit_hours
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1
    `, [student_id]);

    let totalPoints = 0;
    let totalCredits = 0;

    for (let row of gradeData.rows) {
      const grade = row.grade;
      const credits = row.credit_hours;

      if (!grade || grade === 'F') continue; // Skip fails and nulls

      let point = 0;
      if (grade === 'A') point = 4.0;
      else if (grade === 'B') point = 3.0;
      else if (grade === 'C') point = 2.0;
      else if (grade === 'D') point = 1.0;

      totalPoints += point * credits;
      totalCredits += credits;
    }

    const gpa = totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);

    // Step 3: Determine classification
    let classification = 'Fail';
    if (gpa >= 3.70) classification = 'First Class';
    else if (gpa >= 3.00) classification = 'Second Class Upper';
    else if (gpa >= 2.00) classification = 'Second Class Lower';
    else if (gpa >= 1.00) classification = 'Pass';

    res.json({
      gpa,
      total_credits: totalCredits,
      classification
    });

  } catch (err) {
    console.error('❌ Degree progression error', err);
    res.status(500).json({ error: 'Failed to compute degree progression' });
  }
});

// GET GPA history per semester for a student
router.get('/gpa-history/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const studentRes = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [user_id]
    );
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student_id = studentRes.rows[0].id;

    const gpaRes = await pool.query(`
      SELECT c.year, c.semester,
        SUM(
          CASE 
            WHEN g.grade = 'A' THEN 4 * c.credit_hours
            WHEN g.grade = 'B' THEN 3 * c.credit_hours
            WHEN g.grade = 'C' THEN 2 * c.credit_hours
            WHEN g.grade = 'D' THEN 1 * c.credit_hours
            ELSE 0
          END
        )::FLOAT / NULLIF(SUM(c.credit_hours), 0) AS gpa
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1
      GROUP BY c.year, c.semester
      ORDER BY c.year, c.semester
    `, [student_id]);

    res.json(gpaRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch GPA history' });
  }
});

router.get('/profile/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT s.reg_no, s.full_name, s.year, s.semester, s.department,
             s.phone, s.guardian_name, s.guardian_contact, s.religion, s.profile_picture,
             u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
    `, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch profile' });
  }
});

router.put('/update-profile/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const {
    phone,
    department,
    guardian_name,
    guardian_contact,
    religion
    // we’ll ignore profile_picture for now
  } = req.body;

  try {
    await pool.query(`
      UPDATE students SET
        phone = $1,
        department = $2,
        guardian_name = $3,
        guardian_contact = $4,
        religion = $5
      WHERE user_id = $6
    `, [phone, department, guardian_name, guardian_contact, religion, user_id]);

    res.json({ message: '✅ Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to update profile' });
  }
});

// 📍 Change Password for Student
router.post('/change-password', async (req, res) => {
  const { user_id, currentPassword, newPassword } = req.body;

  try {
    const userRes = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [user_id]
    );

    if (userRes.rows.length === 0)
      return res.json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!match)
      return res.json({ success: false, message: 'Current password is incorrect' });

    const hashedNew = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, user_id]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Password change error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
