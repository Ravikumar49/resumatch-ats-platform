import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// Importing your pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManageResume from './pages/ManageResume';
import AdminRoute from './AppRoute';

function SmartNavBar() {
  const location = useLocation(); // Gets the current URL path

  // If the user is on the student or admin dashboard, return "null"
  if (location.pathname === '/student' || location.pathname === '/admin' || location.pathname === '/manage-resume') {
    return null; 
  }

  // Otherwise, render the standard public navigation bar
  return (
    <nav className="bg-gray-800 p-4 text-white flex gap-6 justify-center shadow-md">
      <Link to="/" className="hover:text-blue-400 font-semibold text-lg">Login</Link>
      <Link to="/signup" className="hover:text-green-400 font-semibold text-lg">Sign Up</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Our new smart nav bar handles its own visibility! */}
      <SmartNavBar />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/manage-resume" element={<ManageResume />} />
      </Routes>
    </BrowserRouter>
  );
}