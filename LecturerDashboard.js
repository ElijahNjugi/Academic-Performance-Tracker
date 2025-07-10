import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/LecturerDashboard.css';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function LecturerDashboard() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem('user_id');
  const [lecturerId, setLecturerId] = useState(null);
  const [lecturerName, setLecturerName] = useState('');
  const [courses, setCourses] = useState([]);
  const [studentsByCourse, setStudentsByCourse] = useState({});
  const [grades, setGrades] = useState({});
  const [attendance, setAttendance] = useState({});
  const [visibleAction, setVisibleAction] = useState({});
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedYear, setSelectedYear] = useState('All');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedCourseForLog, setSelectedCourseForLog] = useState('');
  const [selectedCourseForPerf, setSelectedCourseForPerf] = useState('');
  const [selectedLogDate, setSelectedLogDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    axios.get(`http://localhost:5000/api/lecturers/by-user/${user_id}`)
      .then(res => {
        setLecturerId(res.data.id);
        setLecturerName(res.data.full_name);
      })
      .catch(() => setMessage('❌ Could not load lecturer profile'));
  }, [user_id]);

  useEffect(() => {
    if (!lecturerId) return;
    axios.get(`http://localhost:5000/api/courses/lecturer/${lecturerId}`)
      .then(res => setCourses(res.data))
      .catch(() => setMessage('❌ Failed to fetch courses'));
  }, [lecturerId]);

  const fetchEnrolledStudents = async (course_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/enrollments/plain/course/${course_id}`);
      setStudentsByCourse(prev => ({ ...prev, [course_id]: res.data }));
    } catch {
      setMessage('❌ Failed to fetch enrolled students');
    }
  };

  const fetchAttendanceLogs = async (course_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/logs/${course_id}`);
      setAttendanceLogs(res.data);
      setSelectedLogDate('');
      setMessage('');
    } catch {
      setMessage('❌ Failed to fetch attendance logs');
    }
  };

  const fetchClassPerformance = async (course_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/grades/class/${course_id}`);
      setPerformanceData(res.data);
      setMessage('');
    } catch {
      setMessage('❌ Failed to fetch class performance');
    }
  };

  const toggleAction = (course_id, action) => {
    fetchEnrolledStudents(course_id);
    setVisibleAction(prev => ({
      ...prev,
      [course_id]: prev[course_id] === action ? null : action
    }));
  };

  const handleGradeChange = (enrollment_id, field, value) => {
    setGrades(prev => ({
      ...prev,
      [enrollment_id]: { ...prev[enrollment_id], [field]: value }
    }));
  };

  const submitGrade = async (enrollment_id) => {
    const { score, remarks } = grades[enrollment_id] || {};
    if (!score) return setMessage('❌ Please enter a score');
    try {
      await axios.post('http://localhost:5000/api/grades/record', { enrollment_id, score, remarks });
      setMessage('✅ Grade recorded');
    } catch {
      setMessage('❌ Failed to record grade');
    }
  };

  const handleAttendanceChange = (enrollment_id, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [enrollment_id]: { ...prev[enrollment_id], [field]: value }
    }));
  };

  const submitAttendance = async (enrollment_id) => {
    const { status, duration } = attendance[enrollment_id] || {};
    if (!status || !duration) return setMessage('❌ Fill all attendance fields');
    try {
      await axios.post('http://localhost:5000/api/attendance/mark', {
        enrollment_id, date: today, status, duration: parseInt(duration)
      });
      setMessage('✅ Attendance marked');
    } catch {
      setMessage('❌ Failed to mark attendance');
    }
  };

  const postResource = async (e) => {
    e.preventDefault();
    const course_id = e.target.course.value;
    const title = e.target.title.value;
    const msg = e.target.message.value;
    if (!course_id || !title || !msg) return setMessage('❌ Fill all fields');
    try {
      await axios.post('http://localhost:5000/api/resources/post', {
        posted_by: lecturerId,
        target_course_id: parseInt(course_id),
        target_department: null,
        title,
        message: msg
      });
      setMessage('✅ Update posted');
      e.target.reset();
    } catch {
      setMessage('❌ Failed to post update');
    }
  };

  const years = [...new Set(courses.map(c => c.year))];
  const filteredCourses = selectedYear === 'All'
    ? courses
    : courses.filter(c => c.year === parseInt(selectedYear));
  const grouped = filteredCourses.reduce((acc, c) => {
    const key = `Y${c.year}S${c.semester}`;
    acc[key] = acc[key] || [];
    acc[key].push(c);
    return acc;
  }, {});

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="lecturer-dashboard">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>⬅ Back</button>
        <div className="dashboard-title">
          <h2>📚 Lecturer Dashboard</h2>
          <p className="reg-no">👤 {lecturerName}</p>
        </div>
        <div className="top-links">
          <button onClick={logout}>🚪 Logout</button>
        </div>
      </div>

      <div className="dashboard-tiles">
        <div className={`tile ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
          📘 Courses
        </div>
        <div className={`tile ${activeTab === 'postupdate' ? 'active' : ''}`} onClick={() => setActiveTab('postupdate')}>
          📣 Post Unit Update
        </div>
        <div className={`tile ${activeTab === 'attendanceLogs' ? 'active' : ''}`} onClick={() => setActiveTab('attendanceLogs')}>
          📅 Attendance Logs
        </div>
        <div className={`tile ${activeTab === 'classPerformance' ? 'active' : ''}`} onClick={() => setActiveTab('classPerformance')}>
          📊 Class Performance
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      {activeTab === 'courses' && (
        <div className="panel">
          <h3>Your Courses</h3>
          <label>Filter by Year: </label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option>All</option>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          {Object.entries(grouped).map(([key, list]) => (
            <div key={key}>
              <h4>{key}</h4>
              {list.map(course => (
                <div key={course.id} className="course-card">
                  <h4>{course.course_code} - {course.course_name}</h4>
                  <p>Year {course.year}, Semester {course.semester}</p>
                  <button onClick={() => toggleAction(course.id, 'grade')}>📝 Grade Students</button>
                  <button onClick={() => toggleAction(course.id, 'attendance')}>📅 Mark Attendance</button>

                  {visibleAction[course.id] === 'grade' && studentsByCourse[course.id] && (
                    <table>
                      <thead><tr><th>Reg No</th><th>Name</th><th>Score</th><th>Remarks</th><th>Save</th></tr></thead>
                      <tbody>
                        {studentsByCourse[course.id].map(s => (
                          <tr key={s.enrollment_id}>
                            <td>{s.reg_no}</td>
                            <td>{s.full_name}</td>
                            <td><input type="number" value={grades[s.enrollment_id]?.score || ''} onChange={e => handleGradeChange(s.enrollment_id, 'score', e.target.value)} /></td>
                            <td><input type="text" value={grades[s.enrollment_id]?.remarks || ''} onChange={e => handleGradeChange(s.enrollment_id, 'remarks', e.target.value)} /></td>
                            <td><button onClick={() => submitGrade(s.enrollment_id)}>💾</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {visibleAction[course.id] === 'attendance' && studentsByCourse[course.id] && (
                    <table>
                      <thead><tr><th>Reg No</th><th>Name</th><th>Status</th><th>Duration</th><th>Mark</th></tr></thead>
                      <tbody>
                        {studentsByCourse[course.id].map(s => (
                          <tr key={s.enrollment_id}>
                            <td>{s.reg_no}</td>
                            <td>{s.full_name}</td>
                            <td>
                              <select value={attendance[s.enrollment_id]?.status || ''} onChange={e => handleAttendanceChange(s.enrollment_id, 'status', e.target.value)}>
                                <option value="">--</option>
                                <option>Present</option>
                                <option>Absent</option>
                              </select>
                            </td>
                            <td>
                              <select value={attendance[s.enrollment_id]?.duration || 1} onChange={e => handleAttendanceChange(s.enrollment_id, 'duration', e.target.value)}>
                                <option value="1">1 hr</option>
                                <option value="2">2 hrs</option>
                              </select>
                            </td>
                            <td><button onClick={() => submitAttendance(s.enrollment_id)}>✅</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendanceLogs' && (
        <div className="panel">
          <h3>📅 Attendance Logs</h3>
          <select value={selectedCourseForLog} onChange={e => {
            const cid = e.target.value;
            setSelectedCourseForLog(cid);
            if (cid) fetchAttendanceLogs(cid);
          }}>
            <option value="">-- Select Course --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
            ))}
          </select>

          {attendanceLogs.length > 0 && (
            <>
              <select value={selectedLogDate} onChange={e => setSelectedLogDate(e.target.value)}>
                <option value="">-- Filter by Date (optional) --</option>
                {[...new Set(attendanceLogs.map(a => a.date))].map(date => (
                  <option key={date} value={date}>{new Date(date).toISOString().split('T')[0]}</option>
                ))}
              </select>
              <table>
                <thead><tr><th>Date</th><th>Reg No</th><th>Name</th><th>Status</th><th>Duration</th></tr></thead>
                <tbody>
                  {attendanceLogs
                    .filter(a => !selectedLogDate || a.date === selectedLogDate)
                    .map((a, i) => (
                      <tr key={i}>
                        <td>{new Date(a.date).toISOString().split('T')[0]}</td>
                        <td>{a.reg_no}</td>
                        <td>{a.full_name}</td>
                        <td>{a.status}</td>
                        <td>{a.duration} hr(s)</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
          {attendanceLogs.length === 0 && <p>No records found yet.</p>}
        </div>
      )}

      {activeTab === 'classPerformance' && (
        <div className="panel">
          <h3>📊 Class Performance</h3>
          <select value={selectedCourseForPerf} onChange={e => {
            const cid = e.target.value;
            setSelectedCourseForPerf(cid);
            if (cid) fetchClassPerformance(cid);
          }}>
            <option value="">-- Select Course --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
            ))}
          </select>

          {performanceData.length > 0 ? (
            <>
              <table>
                <thead><tr><th>Reg No</th><th>Name</th><th>Grade</th><th>Attendance %</th></tr></thead>
                <tbody>
                  {performanceData.map((s, i) => (
                    <tr key={i}>
                      <td>{s.reg_no}</td>
                      <td>{s.full_name}</td>
                      <td>{s.grade || '-'}</td>
                      <td>{s.attendance_percent !== null ? `${s.attendance_percent}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={
                  performanceData.reduce((acc, curr) => {
                    const existing = acc.find(a => a.grade === (curr.grade || 'None'));
                    if (existing) {
                      existing.count += 1;
                    } else {
                      acc.push({ grade: curr.grade || 'None', count: 1 });
                    }
                    return acc;
                  }, [])
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4b6cb7" />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p>No performance data yet.</p>
          )}
        </div>
      )}

      {activeTab === 'postupdate' && (
        <div className="panel">
          <h3>📣 Post Update</h3>
          <form onSubmit={postResource}>
            <select name="course" required>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
              ))}
            </select>
            <input type="text" name="title" placeholder="Title" required />
            <textarea name="message" placeholder="Message" required></textarea>
            <button type="submit">Post Update</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default LecturerDashboard;
