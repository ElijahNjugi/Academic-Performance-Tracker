import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import '../styles/CourseAdminDashboard.css';
import { useNavigate } from 'react-router-dom';

function CourseAdminDashboard() {
  const user_id = localStorage.getItem('user_id');
  const navigate = useNavigate();

  const [adminInfo, setAdminInfo] = useState({});
  const [courses, setCourses] = useState([]);
  const [studentsByCourse, setStudentsByCourse] = useState({});
  const [gradeStats, setGradeStats] = useState({});
  const [requests, setRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState('retakes');
  const [message, setMessage] = useState('');
  const [selectedYearGroup, setSelectedYearGroup] = useState(null);
  const [examOfficeData, setExamOfficeData] = useState([]);
  const [selectedExamCourse, setSelectedExamCourse] = useState('');

  // Mock Data
  const simulatedBalances = [
    { full_name: 'Kevin Otieno', reg_no: '167651', balance: -5000 },
    { full_name: 'Mercy Nyawira', reg_no: '164562', balance: 0 },
    { full_name: 'John Kariuki', reg_no: '166666', balance: 3000 },
  ];

  const lostIdApplications = [
    { full_name: 'Lilian Wanjiku', reg_no: '169820', reason: 'Lost during travel to school' },
    { full_name: 'Brian Mwangi', reg_no: '167823', reason: 'Stolen in hostel' },
  ];


const fetchAdminInfo = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/course-admins/by-user/${user_id}`);
    setAdminInfo(res.data);
    fetchCourses(res.data.department);
    fetchRequests(res.data.department);
  } catch (err) {
    console.error(err);
    setMessage('❌ Failed to load admin info');
  }
};

useEffect(() => {
  fetchAdminInfo();
}, []);

  const fetchCourses = async (department) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/by-department/${department}`);
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to load courses');
    }
  };

  const fetchStudents = async (course_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/enrollments/course/${course_id}`);
      const { students, gradeCounts } = res.data;

      setStudentsByCourse(prev => ({ ...prev, [course_id]: students }));
      setGradeStats(prev => ({ ...prev, [course_id]: gradeCounts }));
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to load enrolled students');
    }
  };

  const fetchRequests = async (department) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/retakes/department/${department}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to fetch retake/resit requests');
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/retakes/update/${id}`, { status });
      setMessage(`✅ Request ${status}`);
      fetchRequests(adminInfo.department);
    } catch (err) {
      console.error(err);
      setMessage(`❌ Failed to ${status} request`);
    }
  };

  const groupCoursesBySemester = (courseList) => {
    const grouped = {};
    courseList.forEach(course => {
      const key = `Y${course.year}S${course.semester}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(course);
    });
    return grouped;
  };

  const fetchExamOfficeData = async (course_id) => {
  try {
    const res = await axios.get(`http://localhost:5000/api/exam-office/records/${course_id}`);
    setExamOfficeData(res.data);
    setMessage('');
  } catch (err) {
    console.error(err);
    setMessage('❌ Failed to fetch exam office records');
  }
};

  const groupedCourses = groupCoursesBySemester(courses);

  const renderChart = (counts) => {
    const data = Object.entries(counts).map(([grade, count]) => ({ grade, count }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="grade" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" name="Students" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="course-admin-dashboard">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
        <div className="dashboard-title">
          <h2>🎓 Course Admin Dashboard</h2>
          <p className="admin-info">{adminInfo.full_name} ({adminInfo.department})</p>
        </div>
        <button className="logout-button" onClick={logout}>Logout</button>
      </div>

      {/* Tile Navigation */}
      <div className="dashboard-tiles">
        {[
          ['retakes', '📄 Retakes'],
          ['courses', '📘 Department Courses'],
          ['year', '🔍 Filter by Year'],
          ['fees', '💰 School Fees'],
          ['lostid', '🆔 Lost ID Requests'],
          ['postnotice', '📢 Post Notice'],
          ['examoffice', '📑 Exam Office']
        ].map(([key, label]) => (
          <div
            key={key}
            className={`tile ${selectedTab === key ? 'active' : ''}`}
            onClick={() => setSelectedTab(key)}
          >
            {label}
          </div>
        ))}
      </div>

      <p className="status-message">{message}</p>

      {/* Retakes Panel */}
      {selectedTab === 'retakes' && (
        <div className="panel">
          <h3>📄 Retake & Resit Requests</h3>
          {requests.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.full_name} ({r.reg_no})</td>
                    <td>{r.course_code} - {r.course_name}</td>
                    <td>{r.type}</td>
                    <td>{r.reason}</td>
                    <td>{r.status}</td>
                    <td>{new Date(r.requested_at).toLocaleDateString()}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <>
                          <button className="approve-btn" onClick={() => updateRequestStatus(r.id, 'approved')}>Approve</button>
                          <button className="reject-btn" onClick={() => updateRequestStatus(r.id, 'rejected')}>Reject</button>
                        </>
                      ) : <span>{r.status}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No retake/resit requests found.</p>}
        </div>
      )}

      {/* Courses Panel */}
      {selectedTab === 'courses' && (
        <div className="panel">
          <h3>📘 Department Courses</h3>
          {Object.entries(groupedCourses).map(([groupKey, courseList]) => (
            <div key={groupKey}>
              <div className="group-heading">{groupKey}</div>
              {courseList.map(course => (
                <div className="course-box" key={course.id}>
                  <h4>{course.course_code} - {course.course_name}</h4>
                  <p>Lecturer ID: {course.lecturer_id} | Year: {course.year} | Semester: {course.semester}</p>
                  <button onClick={() => fetchStudents(course.id)}>📋 View Class</button>

                  {Array.isArray(studentsByCourse[course.id]) && (
                    <>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Reg No</th>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Attendance %</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsByCourse[course.id].map(student => (
                            <tr key={student.enrollment_id}>
                              <td>{student.student_id}</td>
                              <td>{student.reg_no}</td>
                              <td>{student.full_name}</td>
                              <td>{student.grade || '-'}</td>
                              <td>{student.attendance_percent ? `${student.attendance_percent}%` : '-'}</td>
                              <td>{student.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {gradeStats[course.id] && (
                        <div className="chart-section">
                          <div className="grade-distribution-title">📊 Grade Distribution</div>
                          {renderChart(gradeStats[course.id])}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Filter by Year */}
      {selectedTab === 'year' && (
        <div className="panel">
          <h3>📅 Filter by Year</h3>
          <select onChange={(e) => setSelectedYearGroup(e.target.value)} value={selectedYearGroup || ''}>
            <option value="">-- Select a Year Group --</option>
            {Object.keys(groupedCourses).map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          {selectedYearGroup && groupedCourses[selectedYearGroup] && (
            <div>
              {groupedCourses[selectedYearGroup].map(course => (
                <div className="course-box" key={course.id}>
                  <h4>{course.course_code} - {course.course_name}</h4>
                  <p>Lecturer ID: {course.lecturer_id} | Year: {course.year} | Semester: {course.semester}</p>
                  <button onClick={() => fetchStudents(course.id)}>📋 View Class</button>

                  {Array.isArray(studentsByCourse[course.id]) && (
                    <>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Reg No</th>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Attendance %</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsByCourse[course.id].map(student => (
                            <tr key={student.enrollment_id}>
                              <td>{student.student_id}</td>
                              <td>{student.reg_no}</td>
                              <td>{student.full_name}</td>
                              <td>{student.grade || '-'}</td>
                              <td>{student.attendance_percent ? `${student.attendance_percent}%` : '-'}</td>
                              <td>{student.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {gradeStats[course.id] && (
                        <div className="chart-section">
                          <div className="grade-distribution-title">📊 Grade Distribution</div>
                          {renderChart(gradeStats[course.id])}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simulated School Fees Panel */}
      {selectedTab === 'fees' && (
        <div className="panel">
          <h3>💰 Student Fee Balances</h3>
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>Reg No</th><th>Balance (KES)</th></tr>
            </thead>
            <tbody>
              {simulatedBalances.map((s, idx) => (
                <tr key={idx}>
                  <td>{s.full_name}</td>
                  <td>{s.reg_no}</td>
                  <td style={{ color: s.balance < 0 ? 'red' : 'green' }}>{s.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simulated Lost ID Panel */}
      {selectedTab === 'lostid' && (
        <div className="panel">
          <h3>🆔 Lost ID Applications</h3>
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>Reg No</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {lostIdApplications.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.full_name}</td>
                  <td>{r.reg_no}</td>
                  <td>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    {selectedTab === 'postnotice' && (
      <div className="panel">
        <h3>📢 Post Department Notice</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await axios.post('http://localhost:5000/api/resources/post', {
                posted_by: adminInfo.id,
                target_department: adminInfo.department,
                target_course_id: null,
                title: e.target.title.value,
                message: e.target.message.value,
              });
              setMessage('✅ Notice posted successfully!');
              e.target.reset();
            } catch (err) {
              console.error(err);
              setMessage('❌ Failed to post notice.');
            }
          }}
        >
          <input type="text" name="title" placeholder="Notice Title" required className="input-field" />
          <textarea name="message" placeholder="Write your message..." required className="textarea-field" />
          <button type="submit" className="submit-button">Post Notice</button>
        </form>
      </div>
    )}

    {selectedTab === 'examoffice' && (
      <div className="panel exam-office-panel">
        <h3>📑 Exam Office - View Course Records</h3>
        <select value={selectedExamCourse} onChange={e => {
          const cid = e.target.value;
          setSelectedExamCourse(cid);
          if (cid) fetchExamOfficeData(cid);
        }}>
          <option value="">-- Select Course --</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
          ))}
        </select>

        {examOfficeData.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>Reg No</th><th>Grade</th><th>Score</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {examOfficeData.map((row, idx) => (
                <tr key={idx}>
                <td>{row.full_name}</td>
                <td>{row.reg_no}</td>
                <td>{row.grade || '-'}</td>
                <td>{row.score !== null ? row.score : '-'}</td>
                <td>{row.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        selectedExamCourse && <p>No records found for this course.</p>
      )}
    </div>
  )}
</div>
  );
}

export default CourseAdminDashboard;
