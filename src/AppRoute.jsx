import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
    // 1. Grab both the ID and the Role from local storage
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // 2. If there is no ID at all, kick them to your corrected login route ("/")
    if (!userId) {
        return <Navigate to="/" replace />;
    }

    // 3. If they are logged in, but their role is NOT 'admin', kick them to the student dashboard
    if (userRole !== 'admin') {
        return <Navigate to="/student" replace />;
    }

    // Otherwise
    return children;
}