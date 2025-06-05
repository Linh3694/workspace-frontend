import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Profile from './pages/Admission/Profile';
import Family from './pages/Admission/Family';
import SchoolYearCalendar from './pages/SchoolYear/schoolyearCalendar';
import Class from './pages/SchoolYear/class';
import Timetable from './pages/SchoolYear/Timetable';
import EducationalProgram from './pages/SchoolYear/EducationalSystem';
import Curriculum from './pages/SchoolYear/Curriculum';
import Year from './pages/SchoolYear/year';
import Subject from './pages/SchoolYear/Subject';
import UserManagement from './pages/Settings/UserManagement';
import Teacher from './pages/SchoolYear/Teacher';
import Grade from './pages/SchoolYear/GradeLevel';
import Room from './pages/Facilities/Room';
import Student from './pages/Student/StudentInformation/Student';
import ReportCard from './pages/Student/ReportCard';
import Attendance from './pages/Student/Attendance';
import CommunicationBook from './pages/Student/CommunicationBook';
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

          {/* SchoolYear routes */}
          <Route path="academic/years" element={<Year />} />
          <Route path="academic/classes" element={<Class />} />
          <Route path="academic/school-calendar" element={<SchoolYearCalendar />} />
          <Route path="academic/educational-programs" element={<EducationalProgram />} />
          <Route path="academic/curriculums" element={<Curriculum />} />
          <Route path="academic/timetables" element={<Timetable />} />
          <Route path="academic/subjects" element={<Subject />} />
          <Route path="academic/teachers" element={<Teacher />} />
          <Route path="academic/grades" element={<Grade />} />

          {/* Student Management routes - TODO: Implement these components */}
          <Route path="students/info" element={<Student />} />
          <Route path="students/attendance" element={<Attendance />} />
          <Route path="students/grades" element={<ReportCard />} />
          <Route path="students/reports" element={<CommunicationBook />} />
          
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
