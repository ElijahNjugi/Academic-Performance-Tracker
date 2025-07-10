// src/pages/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css'; // ✅ Keep your nice design

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { role, id } = res.data.user;

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', role);
      localStorage.setItem('user_id', id);

      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'student') navigate('/student/dashboard');
      else if (role === 'lecturer') navigate('/lecturer/dashboard');
      else if (role === 'course_admin') navigate('/course-admin/dashboard');
      else alert('Unknown user role');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">University Academic Performance System</h1>
      <h2 className="login-subtitle">UAPMS</h2>

      <div className="login-box">
        <h3 className="login-heading">Login</h3>

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleLogin}>Login</button>

        {errorMsg && <p className="login-error">{errorMsg}</p>}

        <div className="login-links">
          <button className="lost-btn" onClick={() => alert("📞 Please contact system admin to reset your password.")}>
            Lost Password?
          </button>
        </div>
      </div>

      <footer className="login-footer">@UAPMS</footer>
    </div>
  );
}

export default LoginPage;
