import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [activeTile, setActiveTile] = useState('student');

  // Forms
  const [form, setForm] = useState({
    email: '', password: '', reg_no: '', full_name: '', year: '', semester: '', department: ''
  });
  const [lecturerForm, setLecturerForm] = useState({
    email: '', password: '', full_name: '', department: ''
  });
  const [courseForm, setCourseForm] = useState({
    course_code: '', course_name: '', credit_hours: '', year: '', semester: '', lecturer_id: '', department: ''
  });
  const [courseAdminForm, setCourseAdminForm] = useState({
    email: '', password: '', full_name: '', department: ''
  });
  const [resetForm, setResetForm] = useState({
    email: '', new_password: ''
  });

  // Handlers
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleLecturerChange = e => setLecturerForm({ ...lecturerForm, [e.target.name]: e.target.value });
  const handleCourseChange = e => setCourseForm({ ...courseForm, [e.target.name]: e.target.value });
  const handleCourseAdminChange = e => setCourseAdminForm({ ...courseAdminForm, [e.target.name]: e.target.value });
  const handleResetChange = e => setResetForm({ ...resetForm, [e.target.name]: e.target.value });

  // Submit functions
  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/students/create-user', form);
      setMessage(`✅ Student ${res.data.student.full_name} created`);
    } catch {
      setMessage('❌ Failed to create student user');
    }
  };

  const handleLecturerSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/lecturers/create-user', lecturerForm);
      setMessage(`✅ Lecturer ${res.data.lecturer.full_name} created`);
    } catch {
      setMessage('❌ Failed to create lecturer user');
    }
  };

  const handleCourseSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/courses/create', courseForm);
      setMessage(`✅ Course ${res.data.course.course_name} created`);
    } catch {
      setMessage('❌ Failed to create course');
    }
  };

  const handleCourseAdminSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/course-admins/create-user', courseAdminForm);
      setMessage(`✅ Course Admin ${res.data.course_admin.full_name} created`);
    } catch {
      setMessage('❌ Failed to create course admin');
    }
  };

  const handleResetSubmit = async () => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/reset-password', resetForm);
      setMessage(`✅ Password reset for ${res.data.user.email}`);
      setResetForm({ email: '', new_password: '' });
    } catch (err) {
      setMessage(err.response?.data?.error || '❌ Failed to reset password');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>⬅ Back</button>
        <div className="dashboard-title"><h2>⚙️ System Admin Dashboard</h2></div>
        <div className="top-links">
          <button onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-tiles">
        {['student', 'lecturer', 'course', 'course_admin', 'reset_password'].map(tile => (
          <div
            key={tile}
            className={`tile ${activeTile === tile ? 'active' : ''}`}
            onClick={() => setActiveTile(tile)}
          >
            {{
              student: '👨‍🎓 Add Student',
              lecturer: '👩‍🏫 Add Lecturer',
              course: '📘 Add Course',
              course_admin: '🧑‍💼 Add Course Admin',
              reset_password: '🔑 Reset Password'
            }[tile]}
          </div>
        ))}
      </div>

      {message && <p className="message">{message}</p>}

      {activeTile === 'student' && (
        <div className="panel">
          <h3>Create New Student User</h3>
          {['email', 'password', 'reg_no', 'full_name', 'year', 'semester'].map(field => (
            <input
              key={field}
              name={field}
              type={field === 'password' ? 'password' : field === 'year' || field === 'semester' ? 'number' : 'text'}
              placeholder={field.replace('_', ' ').toUpperCase()}
              value={form[field]}
              onChange={handleChange}
            />
          ))}

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            <option value="BICS">BICS</option>
            <option value="BBIT">BBIT</option>
            <option value="LAW">LAW</option>
            <option value="HOSPITALITY">BBT</option>
          </select>
          <button onClick={handleSubmit}>Create Student</button>
        </div>
      )}

      {activeTile === 'lecturer' && (
        <div className="panel">
          <h3>Create New Lecturer User</h3>
          {['email', 'password', 'full_name', 'department'].map(field => (
            <input
              key={field}
              name={field}
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field.replace('_', ' ').toUpperCase()}
              value={lecturerForm[field]}
              onChange={handleLecturerChange}
            />
          ))}
          <button onClick={handleLecturerSubmit}>Create Lecturer</button>
        </div>
      )}

      {activeTile === 'course' && (
        <div className="panel">
          <h3>Create New Course</h3>
          {['course_code', 'course_name', 'credit_hours', 'year', 'semester', 'lecturer_id'].map(field => (
            <input
              key={field}
              name={field}
              placeholder={field.replace('_', ' ').toUpperCase()}
              onChange={handleCourseChange}
              type={['credit_hours', 'year', 'semester'].includes(field) ? 'number' : 'text'}
            />
          ))}

          <select
            name="department"
            value={courseForm.department}
            onChange={handleCourseChange}
            required
          >
            <option value="">Select Department</option>
            <option value="BICS">BICS</option>
            <option value="BBIT">BBIT</option>
            <option value="LAW">LAW</option>
            <option value="BBT">BBT</option>
          </select>
          
          <button onClick={handleCourseSubmit}>Create Course</button>
        </div>
      )}

      {activeTile === 'course_admin' && (
        <div className="panel">
          <h3>Create New Course Admin</h3>
          {['email', 'password', 'full_name', 'department'].map(field => (
            <input
              key={field}
              name={field}
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field.replace('_', ' ').toUpperCase()}
              value={courseAdminForm[field]}
              onChange={handleCourseAdminChange}
            />
          ))}
          <button onClick={handleCourseAdminSubmit}>Create Course Admin</button>
        </div>
      )}

      {activeTile === 'reset_password' && (
        <div className="panel">
          <h3>🔑 Reset User Password</h3>
          <input
            name="email"
            type="email"
            placeholder="User Email"
            value={resetForm.email}
            onChange={handleResetChange}
          />
          <input
            name="new_password"
            type="password"
            placeholder="New Password"
            value={resetForm.new_password}
            onChange={handleResetChange}
          />
          <button onClick={handleResetSubmit}>Reset Password</button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
