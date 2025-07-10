const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/create-user', async (req, res) => {
  const { email, password, full_name, department } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    // 1. Create user with role = lecturer
    const userResult = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
      [email, hashed, 'lecturer']
    );
    const user = userResult.rows[0];

    // 2. Create lecturer profile
    const lecturerResult = await pool.query(
      'INSERT INTO lecturers (user_id, full_name, department) VALUES ($1, $2, $3) RETURNING *',
      [user.id, full_name, department]
    );

    const lecturer = lecturerResult.rows[0];
    res.status(201).json({ message: 'Lecturer created', user, lecturer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lecturer creation failed' });
  }
});

router.get('/by-user/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, full_name FROM lecturers WHERE user_id = $1',
      [user_id]
);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Lecturer not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lecturer info' });
  }
});

module.exports = router;
