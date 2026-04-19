import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ResumeUpload from './ResumeUpload';

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [techStack, setTechStack] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const userId = localStorage.getItem('userId');
  const [activeView, setActiveView] = useState('dashboard');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [aiSkills, setAiSkills] = useState([]);

  // Fetch the jobs when the dashboard loads
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('https://resumatch-ats-platform.onrender.com/api/jobs');
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  // The Apply Function
  const handleApply = async (jobId) => {
    console.log("Checking IDs before sending:", { jobId, userId });
    if (!userId || userId === "null") return alert("You must be logged in to apply.");

    try {
      const response = await fetch('https://resumatch-ats-platform.onrender.com/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: jobId, 
          studentId: userId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("Application submitted successfully!");
      } else {
        alert(data.error || "Failed to apply.");
      }
    } catch (error) {
      console.error("Error applying:", error);
    }
  };

  // SECURITY & DATA FETCHING
  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch(`https://resumatch-ats-platform.onrender.com/api/projects/${userId}`);
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [userId, navigate, refreshCount]);


  useEffect(() => {

    const fetchApplication = async () => {
    if(!userId) return;
    try {
      const response = await fetch(`https://resumatch-ats-platform.onrender.com/api/applications/${userId}`);
      if(response.ok) {
        const data = await response.json();
        setAppliedJobs(data);
      }
    }
    catch (error) {
      console.error("Error fetching applications: ", error);
    }
    };

    fetchApplication();
  }, [userId]);

  // NEW: Fetch the student's profile to get their AI Skills
  useEffect(() => {
    const fetchProfile = async () => {
      if(!userId) return;
      try {
        const response = await fetch(`https://resumatch-ats-platform.onrender.com/api/user/profile/${userId}`);
        if(response.ok) {
          const data = await response.json();
          // If they have AI skills, convert them into a lowercase array for matching
          if (data.ai_skills) {
            setAiSkills(data.ai_skills.split(',').map(s => s.trim().toLowerCase()));
          }
        }
      }
      catch (error) {
        console.error("Error fetching profile: ", error);
      }
    };

    fetchProfile();
  }, [userId]);

  // ADD NEW PROJECT LOGIC
  const handleAddProject = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://resumatch-ats-platform.onrender.com/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          title: title, 
          tech_stack: techStack, 
          github_link: githubLink 
        })
      });

      const data = await response.json();

      if (data.success) {
        // Clear the form
        setTitle('');
        setTechStack('');
        setGithubLink('');
        // This automatically forces the useEffect above to run again.
        setRefreshCount(prev => prev + 1);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error adding project:", error);
      alert("Failed to connect to server.");
    }
  };

  const availableJobs = jobs.filter(job => {
    // Check if this job's ID exists anywhere in appliedJobs array
    const hasApplied = appliedJobs.some(appliedJobs => appliedJobs.job_id === job.id);
    return !hasApplied;
  });


  // Helper function to compare job skills against student skills
  const calculateMatch = (jobSkillsString) => {
    if (!jobSkillsString) return 0;
    
    // Convert job skills into a clean array
    const requiredSkills = jobSkillsString.split(',').map(s => s.trim().toLowerCase());
    if (requiredSkills.length === 0) return 0;

    // Count how many required skills exist in the student's skill list
    const matchedCount = requiredSkills.filter(skill => aiSkills.includes(skill)).length;
    
    // Calculate percentage and round to nearest whole number
    return Math.round((matchedCount / requiredSkills.length) * 100);
  };

  // LOGOUT LOGIC
  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/');
  };

  // If nobody is logged in at all, kick to login screen.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. If they are logged in, but are NOT a student, kick to admin.
  if (user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/student" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header Area */}
      <header className="mb-8 flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Profile</h1>
          <p className="text-gray-600">Manage your project portfolio.</p>
        </div>
        
        {/* Wrapped buttons in a flex container for neat alignment */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/manage-resume')} 
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          >
            Manage Resume
          </button>
          {/* My Application button */}
          <button
            onClick={() => setActiveView(activeView === 'dashboard' ? 'applications' : 'dashboard')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded shadow transition"
          >
            {activeView === 'dashboard' ? 'My Applications' : 'Back to dashboard'}
          </button>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* --- THE VIEW TOGGLE --- */}
      {activeView === 'dashboard' ? (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Add Project Form */}
            <div className="lg:col-span-1 p-6 bg-white rounded-lg shadow border-t-4 border-green-500 h-fit">
              <h2 className="font-semibold text-xl mb-4 text-gray-800">Add New Project</h2>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input 
                    type="text" required
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    placeholder="e.g., ResuMatch Screener"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
                  <input 
                    type="text" required
                    value={techStack} onChange={(e) => setTechStack(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    placeholder="e.g., React, Node, MySQL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Link (Optional)</label>
                  <input 
                    type="url" 
                    value={githubLink} onChange={(e) => setGithubLink(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    placeholder="https://github.com/..."
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold">
                  Save Project
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: Project Portfolio List */}
            <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow border-t-4 border-blue-500">
              <h2 className="font-semibold text-xl mb-4 text-gray-800">My Portfolio</h2>
              
              {/* Conditional Rendering: Show message if no projects, otherwise list them */}
              {projects.length === 0 ? (
                <p className="text-gray-500 italic">No projects added yet. Start building your portfolio!</p>
              ) : (
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-bold text-blue-600">{proj.title}</h3>
                      <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Tech:</span> {proj.tech_stack}</p>
                      {proj.github_link && (
                        <a href={proj.github_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                          View on GitHub →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* ----------------------------- */}
          </div>

          {/* --- THE JOB BOARD --- */}
          <div className="mt-12 w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Open Opportunities</h2>
            
            {availableJobs.length === 0 ? (
              <p className="text-gray-500 italic">No jobs posted yet. Check back later!</p>
            ) : (
              <div className="flex overflow-x-auto gap-6 pb-4 pt-2">
                {availableJobs.map((job) => {
                  const matchPercentage = calculateMatch(job.skills_required);
                  
                  return (
                  <div key={job.id} className="min-width: 300px shrink-0 bg-white p-6 border rounded-lg shadow-sm hover:shadow-md transition">
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-blue-700">{job.title}</h3>
                        {/* Company / Recruiter Display */}
                        <p className="text-sm font-semibold text-gray-700 mt-1 flex items-center gap-1">
                          🏢 {job.recruiter_email ? job.recruiter_email.split('@')[1].split('.')[0].toUpperCase() : 'VERIFIED COMPANY'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Posted: {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                        {job.openings} Openings
                      </span>
                    </div>

                    {/* The Match Percentage */}
                    <div className="mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded border inline-flex items-center gap-1
                        ${matchPercentage >= 75 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                          matchPercentage >= 50 ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        Match for this job: {matchPercentage}%
                      </span>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.skills_required.split(',').map((skill, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleApply(job.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                    >
                      Apply Now
                    </button>

                  </div>
                )})}
              </div>
            )}
          </div>
        </div>

      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-600 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Application History</h2>

          {appliedJobs.length === 0 ? (
            <p className="text-gray-500 italic">You haven't applied to any jobs yet. Check out the Open Opportunities!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appliedJobs.map((app) => (
                <div key={app.application_id} className="border border-purple-100 rounded-lg p-5 shadow-sm bg-purple-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-purple-800">{app.title}</h3>
                      {/* NEW: Company / Recruiter Display */}
                      <p className="text-sm font-semibold text-gray-700 mt-1 flex items-center gap-1">
                        🏢 {app.recruiter_email ? app.recruiter_email.split('@')[1].split('.')[0].toUpperCase() : 'VERIFIED COMPANY'}
                      </p>
                    </div>
                    {/* Status of Application*/}
                    {app.status === 'Hired' ? ( // <-- NEW HIRED STAGE
                      <span className="bg-yellow-100 text-yellow-800 text-sm font-extrabold px-4 py-1 rounded-full border-2 border-yellow-400 shadow-md transform scale-105">
                        🎉 HIRED!
                      </span>
                    ) : app.status === 'Accepted' ? (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-300 shadow-sm">
                        Accepted!
                      </span>
                    ) : app.status === 'Rejected' ? (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                        Not Selected
                      </span>
                    ) : app.status === 'Interview' ? ( 
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-300 shadow-sm animate-pulse">
                        Interview Scheduled!
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                        Pending Review
                      </span>
                    )}
                  </div>
                  
                  {/* Automated Rejection Feedback */}
                  {app.status === 'Rejected' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
                      <span className="font-bold block mb-1">Application Update:</span>
                      
                      {app.missing_skills ? (
                        /* Scenario A: They were missing skills */
                        <span>
                          To be competitive for this specific role, consider strengthening your profile with these skills: <span className="font-semibold">{app.missing_skills}</span>.
                        </span>
                      ) : (
                        /* Scenario B: They had all the skills, but didn't get it */
                        <span>
                          While your technical profile was a strong match for the requirements, we have moved forward with other candidates as the available openings for this position have currently been filled.
                        </span>
                      )}
                      
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">Date:</span> {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {app.skills_required.split(',').map((skill, index) => (
                        <span key={index} className="bg-white border text-gray-600 text-xs px-2 py-1 rounded">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      )}
    </div>
  );
}