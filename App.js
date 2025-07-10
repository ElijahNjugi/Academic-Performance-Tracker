import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import CourseAdminDashboard from './pages/CourseAdminDashboard'; 
import StudentProfile from './pages/StudentProfile'; 
import StudentResources from './pages/StudentResources';

<Route path="/student/profile" element={<StudentProfile />} />

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/course-admin/dashboard" element={<CourseAdminDashboard />} /> 
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/resources" element={<StudentResources />} />
      </Routes>
    </Router>
  );
}

export default App;
