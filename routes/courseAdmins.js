const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Register a course admin
router.post('/create-user', async (req, res) => {
  const { email, password, full_name, department } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
      [email, hashed, 'course_admin']
    );
    const user = userResult.rows[0];

    const adminResult = await pool.query(
      'INSERT INTO course_admins (user_id, full_name, department) VALUES ($1, $2, $3) RETURNING *',
      [user.id, full_name, department]
    );

    res.status(201).json({ message: 'Course Admin created', user, course_admin: adminResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Course Admin' });
  }
});

// Fetch course admin by user_id
router.get('/by-user/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, department FROM course_admins WHERE user_id = $1',
      [req.params.user_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Course Admin not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch course admin profile' });
  }
});

module.exports = router;
