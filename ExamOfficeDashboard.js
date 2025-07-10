import React, { useState } from 'react';
import axios from 'axios';
import '../styles/ExamOffice.css';
import { useNavigate } from 'react-router-dom';

function ExamOfficeDashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  const [examRecords, setExamRecords] = useState([]);
  const [courseId, setCourseId] = useState('');

  const fetchExamRecords = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/exam-office/records/${courseId}`);
      setExamRecords(res.data);
      setMessage('');
    } catch {
      setMessage('❌ Failed to fetch exam records');
    }
  };

  return (
    <div className="exam-office-dashboard">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>⬅ Back</button>
        <div className="dashboard-title">
          <h2>🏛️ Exam Office Dashboard</h2>
        </div>
        <div className="top-links">
          <button onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-tiles">
        <div className={`tile ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>
          📑 View Records
        </div>
        <div className={`tile ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>
          ⚙️ Other Actions
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      {activeTab === 'view' && (
        <div className="panel">
          <h3>📑 Fetch Exam Records</h3>
          <input
            placeholder="Course ID"
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
          />
          <button onClick={fetchExamRecords}>Fetch Records</button>

          {examRecords.length > 0 ? (
            <table>
              <thead>
                <tr><th>Reg No</th><th>Name</th><th>Grade</th></tr>
              </thead>
              <tbody>
                {examRecords.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.reg_no}</td>
                    <td>{r.full_name}</td>
                    <td>{r.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No records to display.</p>
          )}
        </div>
      )}

      {activeTab === 'other' && (
        <div className="panel">
          <h3>⚙️ Future exam office actions...</h3>
        </div>
      )}
    </div>
  );
}

export default ExamOfficeDashboard;
