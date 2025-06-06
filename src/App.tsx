import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Profile from './pages/Admission/Profile';
import Family from './pages/Admission/Family';
import SchoolYearCalendar from './pages/Teaching/schoolyearCalendar';
import Class from './pages/Teaching/class';
import Timetable from './pages/Teaching/Timetable';
import EducationalProgram from './pages/Academic/EducationalSystem';
import Curriculum from './pages/Academic/Curriculum';
import Year from './pages/Teaching/year';
import Subject from './pages/Academic/Subject';
import UserManagement from './pages/Settings/UserManagement';
import Teacher from './pages/Teaching/Teacher';
import Grade from './pages/Academic/GradeLevel';
import Room from './pages/Facilities/Room';
import Student from './pages/Student/StudentInformation/Student';
import ReportCard from './pages/Student/ReportCard';
import Attendance from './pages/Student/Attendance';
import CommunicationBook from './pages/Student/CommunicationBook';
import HallOfHonor from './pages/Student/HallOfHonor/HallOfHonor';
import { RecruitmentAdmin } from './pages/Recruitment';
import { Toaster } from './components/ui/sonner';
import { Toaster as HotToaster } from 'react-hot-toast';

import './App.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};


function App() {
  return (
      <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
     
          {/* Admission routes */}
          <Route path="admission/profiles" element={<Profile />} />
          <Route path="admission/families" element={<Family />} />

          {/* Teaching routes */}
          <Route path="teaching/classes" element={<Class />} />
          <Route path="teaching/years" element={<Year />} />
          <Route path="teaching/timetables" element={<Timetable />} />
          <Route path="teaching/teachers" element={<Teacher />} />
          <Route path="teaching/school-year-calendar" element={<SchoolYearCalendar />} />

          {/* Academic routes */}
          <Route path="academic/grade-levels" element={<Grade />} />
          <Route path="academic/educational-programs" element={<EducationalProgram />} />
          <Route path="academic/curriculums" element={<Curriculum />} />
          <Route path="academic/subjects" element={<Subject />} />

          {/* Student Management routes - TODO: Implement these components */}
          <Route path="students/info" element={<Student />} />
          <Route path="students/attendance" element={<Attendance />} />
          <Route path="students/grades" element={<ReportCard />} />
          <Route path="students/reports" element={<CommunicationBook />} />
          <Route path="students/hall-of-honor" element={<HallOfHonor />} />
          
          {/* Academic Management routes - TODO: Implement these components */}
          <Route path="academic/schedule" element={<div>Thời khóa biểu - Đang phát triển</div>} />
          <Route path="academic/exams" element={<div>Kiểm tra - Đang phát triển</div>} />

          {/* Facilities routes */}
          <Route path="facilities/rooms" element={<Room />} />

          {/* Recruitment routes */}
          <Route path="recruitment/jobs" element={<RecruitmentAdmin />} />
          <Route path="recruitment/applications" element={<div>Hồ sơ ứng tuyển - Đang phát triển</div>} />

          {/* Settings routes */}
          <Route path="settings/users" element={<UserManagement />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
      <HotToaster position="top-right" />
    </Router>
  );
}

export default App;
