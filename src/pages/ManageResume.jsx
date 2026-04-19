import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeUpload from './ResumeUpload'; 

export default function ManageResume() {
  const navigate = useNavigate();
  
  const loggedInUserId = localStorage.getItem('userId');

  // Single state object for all profile fields
  const [profile, setProfile] = useState({
    fullName: '',
    bio: '',
    skills: '', // We'll ask them to comma-separate these for now
    education: '',
    linkedin: ''
  });

  // To update the correct field as they type
  const handleChange = (e) => {
    setProfile({ 
      ...profile, 
      [e.target.name]: e.target.value 
    });
  };

  // Handle the form submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Tell the server to expect JSON
        },
        // Package the userId together with the rest of the profile state
        body: JSON.stringify({
          userId: loggedInUserId,
          ...profile 
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile saved successfully!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("A network error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Manage Resume & Profile</h1>
        
        <button 
          onClick={() => navigate('/student')}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          &larr; Manage Portfolio
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto mt-10">
        <p className="text-gray-600 mb-6">
          Upload your latest PDF resume here. You can add additional profile details below.
        </p>
        
        {/* We just drop in your working component! */}
        <ResumeUpload userId={loggedInUserId} />
        
        
      </div>

      <br></br>
      <br></br>
      
      <hr className="border-gray-300" />

        {/* The New Profile Details Form */}
        <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Profile Details</h3>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* NEW: Full Name Input */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Full Name</label>
              <input 
                type="text" 
                value={profile.fullName} 
                onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="e.g., Priya Sharma"
              />
            </div>

            {/* Bio Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Professional Bio</label>
              <textarea 
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200"
                rows="3"
              ></textarea>
            </div>

            {/* Skills Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Core Skills (Comma Separated)</label>
              <input 
                type="text" 
                name="skills"
                value={profile.skills}
                onChange={handleChange}
                placeholder="Skills like C,C++, Python, Node.js, Java Swing, MySQL..."
                className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200"
              />
            </div>

            {/* Education Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Education</label>
              <input 
                type="text" 
                name="education"
                value={profile.education}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200"
              />
            </div>

            {/* LinkedIn Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">LinkedIn Profile URL</label>
              <input 
                type="url" 
                name="linkedin"
                value={profile.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition mt-4"
            >
              Save Profile Details
            </button>
            
          </form>
        </section>
      
    </div>
  );
}