import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Profile from './pages/Admission/Profile';
import Family from './pages/Admission/Family';
import SchoolYearCalendar from './pages/Teaching/schoolyearCalendar';
import Class from './pages/Teaching/class';
import EducationalProgram from './pages/Academic/EducationalSystem';
import Curriculum from './pages/Academic/Curriculum';
import Year from './pages/Teaching/year';
import Subject from './pages/Academic/Subject';
import Timetables from './pages/Academic/Timetables';
import UserManagement from './pages/Settings/UserManagement';
import Teacher from './pages/Teaching/Teacher';
import Grade from './pages/Academic/GradeLevel';
import Room from './pages/Facilities/Room';
import Student from './pages/Student/StudentInformation/Student';
import ReportCard from './pages/Student/ReportCard';
import Attendance from './pages/Student/Attendance';
import CommunicationBook from './pages/Student/CommunicationBook';
import HallOfHonor from './pages/Student/HallOfHonor/HallOfHonor';
import LibraryData from './pages/Library/libraryData';
import LibraryManagement from './pages/Library/libraryManagement';
import LibraryActivities from './pages/Library/libraryActivities';
import { RecruitmentAdmin } from './pages/Recruitment';
import  ApplicationList  from './pages/Recruitment/ApplicationList';
import Inventory from './pages/Technology/Inventory';
import { Toaster } from './components/ui/sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import  TicketList from './pages/Application/Ticket/Admin/TicketList';
import  Ticket  from './pages/Application/Ticket/User/Ticket';
import './App.css';
import { TooltipProvider } from './components/ui/tooltip';

// Wrapper component để truyền currentUser
const TicketListWrapper = () => {
  const { user } = useAuth();
  const mappedUser = user ? { ...user, id: user._id } : null;
  return <TicketList currentUser={mappedUser} />;
};

const TicketWrapper = () => {
  const { user } = useAuth();
  if (!user) return null;
  const mappedUser = { ...user, id: user._id };
  return <Ticket currentUser={mappedUser} />;
};

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <Routes>
                    {/* Public routes */}
            <Route path="/login" element={<Login />} />
              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <RoleProtectedRoute>
                    <Layout />
                  </RoleProtectedRoute>
                }
              >
              <Route index element={<Dashboard />} />
       
              {/* Admission routes */}
              <Route path="admission/profiles" element={
                <RoleProtectedRoute permission="admission.profiles">
                  <Profile />
                </RoleProtectedRoute>
              } />
              <Route path="admission/families" element={
                <RoleProtectedRoute permission="admission.families">
                  <Family />
                </RoleProtectedRoute>
              } />

              {/* Teaching routes */}
              <Route path="teaching/classes" element={
                <RoleProtectedRoute permission="teaching.classes">
                  <Class />
                </RoleProtectedRoute>
              } />
              <Route path="teaching/years" element={
                <RoleProtectedRoute permission="teaching.years">
                  <Year />
                </RoleProtectedRoute>
              } />
              <Route path="teaching/timetables" element={
                <RoleProtectedRoute permission="teaching.timetables">
                  <Timetables  />
                </RoleProtectedRoute>
              } />
              <Route path="teaching/teachers" element={
                <RoleProtectedRoute permission="teaching.teachers">
                  <Teacher />
                </RoleProtectedRoute>
              } />
              <Route path="teaching/school-year-calendar" element={
                <RoleProtectedRoute permission="teaching.calendar">
                  <SchoolYearCalendar />
                </RoleProtectedRoute>
              } />

              {/* Academic routes */}
              <Route path="academic/grade-levels" element={
                <RoleProtectedRoute permission="academic.grade-levels">
                  <Grade />
                </RoleProtectedRoute>
              } />
              <Route path="academic/educational-programs" element={
                <RoleProtectedRoute permission="academic.educational-programs">
                  <EducationalProgram />
                </RoleProtectedRoute>
              } />
              <Route path="academic/curriculums" element={
                <RoleProtectedRoute permission="academic.curriculums">
                  <Curriculum />
                </RoleProtectedRoute>
              } />
              <Route path="academic/subjects" element={
                <RoleProtectedRoute permission="academic.subjects">
                  <Subject />
                </RoleProtectedRoute>
              } />

              {/* Student Management routes */}
              <Route path="students/info" element={
                <RoleProtectedRoute permission="students.info">
                  <Student />
                </RoleProtectedRoute>
              } />
              <Route path="students/attendance" element={
                <RoleProtectedRoute permission="students.attendance">
                  <Attendance />
                </RoleProtectedRoute>
              } />
              <Route path="students/grades" element={
                <RoleProtectedRoute permission="students.grades">
                  <ReportCard />
                </RoleProtectedRoute>
              } />
              <Route path="students/reports" element={
                <RoleProtectedRoute permission="students.reports">
                  <CommunicationBook />
                </RoleProtectedRoute>
              } />
              <Route path="students/hall-of-honor" element={
                <RoleProtectedRoute permission="students.hall-of-honor">
                  <HallOfHonor />
                </RoleProtectedRoute>
              } />
              
              {/* Academic Management routes */}
              <Route path="academic/schedule" element={
                <RoleProtectedRoute permission="academic.schedule">
                  <div>Thời khóa biểu - Đang phát triển</div>
                </RoleProtectedRoute>
              } />
              <Route path="academic/exams" element={
                <RoleProtectedRoute permission="academic.exams">
                  <div>Kiểm tra - Đang phát triển</div>
                </RoleProtectedRoute>
              } />

              {/* Technology routes */}
              <Route path="technology/inventory" element={
                <RoleProtectedRoute permission="technology.inventory">
                  <Inventory />
                </RoleProtectedRoute>
              } />

              {/* Facilities routes */}
              <Route path="facilities/rooms" element={
                <RoleProtectedRoute permission="facilities.rooms">
                  <Room />
                </RoleProtectedRoute>
              } />

              {/* Library routes */}
              <Route path="library/data" element={
                <RoleProtectedRoute permission="library.data">
                  <LibraryData />
                </RoleProtectedRoute>
              } />
              <Route path="library/books" element={
                <RoleProtectedRoute permission="library.books">
                  <LibraryManagement />
                </RoleProtectedRoute>
              } />
              <Route path="library/activities" element={
                <RoleProtectedRoute permission="library.activities">
                  <LibraryActivities />
                </RoleProtectedRoute>
              } />

              {/* Recruitment routes */}
              <Route path="recruitment/jobs" element={
                <RoleProtectedRoute permission="recruitment.jobs">
                  <RecruitmentAdmin />
                </RoleProtectedRoute>
              } />
              <Route path="recruitment/applications" element={
                <RoleProtectedRoute permission="recruitment.applications">
                  <ApplicationList />
                </RoleProtectedRoute>
              } />

              {/* Application routes */}
              <Route path="application/tickets/management" element={
                <RoleProtectedRoute permission="application.tickets.admin">
                  <TicketListWrapper />
                </RoleProtectedRoute>
              } />

               {/* Application routes */}
              <Route path="application/tickets" element={
                <RoleProtectedRoute permission="application.tickets.user">
                  <TicketWrapper />
                </RoleProtectedRoute>
              } />


              {/* Settings routes */}
              <Route path="settings/users" element={
                <RoleProtectedRoute permission="settings.users">
                  <UserManagement />
                </RoleProtectedRoute>
              } />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster />
        <HotToaster position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
