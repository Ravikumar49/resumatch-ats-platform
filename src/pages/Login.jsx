import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  // Setup State to hold the user's input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Initialize the navigation tool
  const navigate = useNavigate();

  // The function that runs when they click "Sign In"
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Send the email and password to our Node.js server
      const response = await fetch('https://resumatch-ats-platform.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Save the user ID to the browser's local memory
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userRole', data.role);
        // Route them based on the role stored in the MySQL database!
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        alert(data.message); // Shows "Invalid email or password"
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">ResuMatch Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          />
          <button 
            type="submit" 
            className="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-semibold transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}