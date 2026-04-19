import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState(''); // The secret recruiter field
  
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, adminCode })
      });

      const data = await response.json();

      if (data.success) {
        // 1. Save their new ID to local storage so the app remembers them
        localStorage.setItem('userId', data.userId);
        
        // 2. Route them based on the role the backend assigned them
        if (data.role === 'admin') {
          alert("Recruiter access granted!");
          navigate('/admin');
        } else {
          alert("Student account created!");
          navigate('/student');
        }
      } else {
        alert(data.message); // e.g., "Email already exists"
      }
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96 border-t-4 border-green-500">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Join ResuMatch</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Create your portfolio or scout top talent.</p>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500" 
            required
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500" 
            required
          />
          
          <div className="pt-2 border-t mt-4">
            <label className="text-xs text-gray-500 font-semibold uppercase">Recruiter? (Optional)</label>
            <input 
              type="password" 
              placeholder="Enter Access Code" 
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-2 mt-4 text-white bg-green-600 rounded hover:bg-green-700 font-semibold transition-colors"
          >
            Create Account
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/" className="text-blue-600 hover:underline font-semibold">Log in here</Link>
        </div>
      </div>
    </div>
  );
}