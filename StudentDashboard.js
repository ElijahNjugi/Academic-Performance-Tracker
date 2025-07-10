import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import '../styles/StudentDashboard.css';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const user_id = localStorage.getItem('user_id');
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState({});
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [gpa, setGpa] = useState(0);
  const [progression, setProgression] = useState(null);
  const [gpaHistory, setGpaHistory] = useState([]);
  const [retakeResitApps, setRetakeResitApps] = useState([]);
  const [message, setMessage] = useState('');
  const [showApps, setShowApps] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');

  useEffect(() => {
    fetchStudentInfo();
    fetchGrades();
    fetchAttendance();
    fetchAvailableCourses();
    fetchGPAHistory();
    fetchApplications();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/by-user/${user_id}`);
      setStudentInfo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/grades/${user_id}`);
      setGrades(res.data);
      calculateGPA(res.data);
    } catch (err) {
      setMessage('❌ Failed to load grades');
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/student/${user_id}`);
      setAttendance(res.data);
    } catch (err) {
      setMessage('❌ Failed to load attendance');
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/available/${user_id}`);
      setAvailableCourses(res.data);
    } catch (err) {
      setMessage('❌ Failed to load courses');
    }
  };

  const fetchGPAHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/gpa-history/${user_id}`);
      setGpaHistory(res.data.map(item => ({
        name: `Y${item.year}.S${item.semester}`,
        gpa: parseFloat(item.gpa).toFixed(2)
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProgression = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/degree-progression/${user_id}`);
      setProgression(res.data);
    } catch (err) {
      setMessage('❌ Failed to fetch progression');
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/retakes/student/${user_id}`);
      setRetakeResitApps(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const enroll = async (course_id) => {
    try {
      await axios.post('http://localhost:5000/api/enrollments/enroll', { user_id, course_id });
      setMessage('✅ Enrolled!');
      fetchAvailableCourses();
      fetchAttendance();
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage('❌ Already enrolled');
      } else {
        setMessage('❌ Enrollment failed');
      }
    }
  };

  const applyForRetakeResit = async (enrollment_id, type) => {
    const reason = window.prompt(`Enter reason for ${type}:`);
    if (!reason) return;
    try {
      await axios.post('http://localhost:5000/api/retakes/apply', {
        enrollment_id,
        type: capitalize(type),
        reason
      });
      setMessage(`✅ ${capitalize(type)} submitted`);
      fetchApplications();
    } catch (err) {
      setMessage(`❌ Failed to submit ${type}`);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const gradeToPoint = (grade) => {
    switch (grade) {
      case 'A': return 4.0;
      case 'B': return 3.0;
      case 'C': return 2.0;
      case 'D': return 1.0;
      default: return 0.0;
    }
  };

  const calculateGPA = (list) => {
    let total = 0, credits = 0;
    list.forEach(entry => {
      const pts = gradeToPoint(entry.grade);
      const cr = entry.credit_hours;
      total += pts * cr;
      credits += cr;
    });
    const gpa = credits === 0 ? 0 : (total / credits).toFixed(2);
    setGpa(gpa);
  };

  const getAttendancePercent = (record) => {
    const expected = record.credit_hours * 14;
    return expected === 0 ? 0 : Math.round((record.attended / expected) * 100);
  };

  const getFailureType = (score) => {
    if (score >= 35 && score <= 39) return 'retake';
    if (score < 35) return 'resit';
    return null;
  };

  const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  return (
    <div className="student-dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
        <button className="profile-button" onClick={() => navigate('/student/profile')}>Profile</button>
        <div className="dashboard-title">
          <h2>Student Dashboard</h2>
          <span className="reg-no">{studentInfo.reg_no}</span>
        </div>
        <div className="top-links">
          <button className="updates-button" onClick={() => navigate('/student/resources')}>📢 Updates</button>
          <a href="https://elearning.strathmore.edu/" target="_blank" rel="noopener noreferrer" className="elearning-link">E-learning</a>
          <button className="logout-button" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Tiles */}
      <div className="dashboard-tiles">
        {[
          ['courses', '📚 Enroll'],
          ['grades', '📘 Grades'],
          ['apps', '📄 Retakes'],
          ['progression', '🎓 Progress'],
          ['gpa', '📈 GPA Chart'],
          ['attendance', '🕓 Attendance']
        ].map(([key, label]) => (
          <div key={key} className={`tile ${selectedTab === key ? 'active' : ''}`} onClick={() => setSelectedTab(key)}>
            {label}
          </div>
        ))}
      </div>

      <p className="message">{message}</p>

      {/* Enroll Tab */}
      {selectedTab === 'courses' && (
        <div className="panel">
          <h3>📚 Enroll to Courses</h3>
          {availableCourses.length > 0 ? (
            <table>
              <thead>
                <tr><th>Code</th><th>Name</th><th>Year</th><th>Sem</th><th>Enroll</th></tr>
              </thead>
              <tbody>
                {availableCourses.map(course => (
                  <tr key={course.id}>
                    <td>{course.course_code}</td>
                    <td>{course.course_name}</td>
                    <td>{course.year}</td>
                    <td>{course.semester}</td>
                    <td><button onClick={() => enroll(course.id)}>Enroll</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No available courses.</p>}
        </div>
      )}

      {/* Grades Tab */}
      {selectedTab === 'grades' && (
        <div className="panel">
          <h3>📘 Your Grades</h3>
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Credits</th><th>Score</th><th>Grade</th><th>Remarks</th><th>Apply</th></tr>
            </thead>
            <tbody>
              {grades.map((entry, i) => {
                const type = getFailureType(entry.score);
                return (
                  <tr key={i}>
                    <td>{entry.course_code}</td>
                    <td>{entry.course_name}</td>
                    <td>{entry.credit_hours}</td>
                    <td>{entry.score}</td>
                    <td>{entry.grade}</td>
                    <td>{entry.remarks}</td>
                    <td>{type ? (
                      <button onClick={() => applyForRetakeResit(entry.enrollment_id, type)}>
                        Apply {capitalize(type)}
                      </button>
                    ) : '✅'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Applications Tab */}
      {selectedTab === 'apps' && (
        <div className="panel">
          <h3>📄 Retake/Resit Applications</h3>
          <button onClick={() => setShowApps(!showApps)}>{showApps ? 'Hide' : 'Show'} Applications</button>
          {showApps && (
            <table>
              <thead>
                <tr><th>Course</th><th>Type</th><th>Reason</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {retakeResitApps.map((app, i) => (
                  <tr key={i}>
                    <td>{app.course_code} - {app.course_name}</td>
                    <td>{app.type}</td>
                    <td>{app.reason}</td>
                    <td>{app.status}</td>
                    <td>{new Date(app.requested_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Degree Progression */}
      {selectedTab === 'progression' && (
        <div className="panel">
          <h3>🎓 Degree Progression</h3>
          <button onClick={fetchProgression}>Check Progress</button>
          {progression && (
            <div>
              <p>✅ GPA: <strong>{progression.gpa}</strong></p>
              <p>📚 Credits: <strong>{progression.total_credits}</strong></p>
              <p>🎓 Degree Class: <strong>{progression.classification}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* GPA History */}
      {selectedTab === 'gpa' && (
        <div className="panel">
          <h3>📈 GPA History</h3>
          {gpaHistory.length > 0 ? (
            <LineChart width={600} height={300} data={gpaHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="gpa" stroke="#8884d8" />
            </LineChart>
          ) : <p>No GPA history.</p>}
        </div>
      )}

      {/* Attendance */}
      {selectedTab === 'attendance' && (
        <div className="panel">
          <h3>🕓 Attendance Summary</h3>
          <table>
            <thead>
              <tr><th>Course Code</th><th>Name</th><th>Credit Hrs</th><th>Attended</th><th>Expected</th><th>%</th><th>Status</th></tr>
            </thead>
            <tbody>
              {attendance.map((rec, i) => {
                const expected = rec.credit_hours * 14;
                const percent = getAttendancePercent(rec);
                const eligible = percent >= 67;
                return (
                  <tr key={i}>
                    <td>{rec.course_code}</td>
                    <td>{rec.course_name}</td>
                    <td>{rec.credit_hours}</td>
                    <td>{rec.attended || 0}</td>
                    <td>{expected}</td>
                    <td>{percent}%</td>
                    <td>{eligible ? '✅ Eligible' : '❌ Not Eligible'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
