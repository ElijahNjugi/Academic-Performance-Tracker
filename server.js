const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const lecturerRoutes = require('./routes/lecturers');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const gradeRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendance');
const courseAdminRoutes = require('./routes/courseAdmins');
const retakesRouter = require('./routes/retakes');
const resourcesRoute = require('./routes/resources');
const examOfficeRoutes = require('./routes/examOffice');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/course-admins', courseAdminRoutes);
app.use('/api/retakes', retakesRouter);
app.use('/api/resources', resourcesRoute);
app.use('/api/exam-office', examOfficeRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
