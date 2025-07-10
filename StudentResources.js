import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/StudentDashboard.css';
import { useNavigate } from 'react-router-dom';

function StudentResources() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem('user_id');
  const [courses, setCourses] = useState([]);
  const [department, setDepartment] = useState('');
  const [resources, setResources] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const fetchStudentDetails = async () => {
    try {
      const studentRes = await axios.get(`http://localhost:5000/api/students/by-user/${user_id}`);
      const { department, year, semester } = studentRes.data;
      setDepartment(department);

      const enrolledRes = await axios.get(`http://localhost:5000/api/courses/enrolled/${user_id}`);
      // Filter courses for current year + semester
      const filtered = enrolledRes.data.filter(c => c.year === year && c.semester === semester);
      setCourses(filtered);

      // Fetch resources for these courses
      fetchResources(department, filtered.map(c => c.id));
    } catch (err) {
      console.error('❌ Failed to load student or course info', err);
    }
  };

  const fetchResources = async (dept, courseIds) => {
    try {
      const res = await axios.post('http://localhost:5000/api/resources/fetch', {
        department: dept,
        course_ids: courseIds
      });
      setResources(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch resources', err);
    }
  };

  const filteredResources = () => {
    if (!selectedTile) return [];
    if (selectedTile === 'department') {
      return resources.filter(r => r.target_department === department);
    } else {
      return resources.filter(r => r.target_course_id === selectedTile);
    }
  };

  return (
    <div className="student-dashboard">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate('/student/dashboard')}>← Back</button>
        <h2>📢 Updates & Resources</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div
            className={`tile ${selectedTile === 'department' ? 'active' : ''}`}
            onClick={() => setSelectedTile('department')}
          >
            Department Notices
          </div>
          {courses.map(c => (
            <div
              key={c.id}
              className={`tile ${selectedTile === c.id ? 'active' : ''}`}
              onClick={() => setSelectedTile(c.id)}
            >
              {c.course_code} - {c.course_name}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <div className="panel">
            {filteredResources().length > 0 ? (
              filteredResources()
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((r, i) => (
                  <div key={i} className="notice-box">
                    <h4>{r.title}</h4>
                    <p>{r.message}</p>
                    <small>Posted at: {new Date(r.timestamp).toLocaleString()}</small>
                    <hr />
                  </div>
                ))
            ) : (
              <p>No updates yet for this section.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentResources;
