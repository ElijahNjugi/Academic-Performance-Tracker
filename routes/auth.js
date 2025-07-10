const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// ✅ Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = userResult.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token: 'mocked-token'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
});

// ✅ Password Change Route (optional or deprecated)
router.post('/change-password', async (req, res) => {
  const { user_id, currentPassword, newPassword } = req.body;

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect' });

    const newHashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHashed, user_id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ✅ Admin Reset Password for any user
router.put('/reset-password', async (req, res) => {
  const { email, new_password } = req.body;
  if (!email || !new_password) {
    return res.status(400).json({ error: 'Email and new password required' });
  }

  try {
    const hashed = await bcrypt.hash(new_password, 10);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashed, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: '✅ Password reset successfully', user: result.rows[0] });
  } catch (err) {
    console.error('❌ Failed to reset password:', err);
    res.status(500).json({ error: '❌ Failed to reset password' });
  }
});

module.exports = router;
