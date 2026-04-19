import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [starredIds, setStarredIds] = useState([]);
  const adminId = localStorage.getItem('userId'); // Get logged-in admin's ID
  const [jobRows, setJobRows] = useState([{ title: '', skillsRequired: '', openings: 1 }]);
  const [applicants, setApplicants] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    async function fetchCandidates() {
      try{
        const response = await fetch('https://resumatch-ats-platform.onrender.com/api/admin/candidates');
        const data = await response.json();

        if(Array.isArray(data)) {
          setCandidates(data);
        }
        else if(data.success) {
          setCandidates(data.candidates);
        }
        else {
          console.error("Backend returned an error:", data.message);
        }
      }
      catch(error) {
        console.error("Error fetching candidates: ", error);
      }
      finally {
        setLoading(false);
      }
    }
    fetchCandidates();

    async function fetchShortlist(){
      if(!adminId) return;
      try {
        const response = await fetch(`https://resumatch-ats-platform.onrender.com/api/admin/shortlist/${adminId}`);
        const data = await response.json();
        setStarredIds(data);
      }
      catch (error) {
        console.error("Error fetching shortlist: ", error);
      }
    }

    fetchShortlist();
  }, [navigate, adminId]);

  // Filter candidates dynamically based on the search bar
  const filteredCandidates = candidates.filter(candidate => {
    // If the search bar is empty, show everyone
    if (!searchTerm) return true;
    
    // Setup the exact same word boundary logic for the filter
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundary = /^[a-zA-Z0-9]/.test(searchTerm) ? '\\b' : '';
    const searchRegex = new RegExp(`${boundary}${escapedSearch}`, 'i');
    
    // Test the skills using the new regex instead of .includes()
    const hasSkill = candidate.skills && searchRegex.test(candidate.skills);
    
    // Test the resume text using the new regex
    const inResume = candidate.resume_text && searchRegex.test(candidate.resume_text);

    const inName = candidate.full_name && searchRegex.test(candidate.full_name);
    const inEmail = candidate.email && searchRegex.test(candidate.email);

    // If it's in either place, keep them on the screen!
    return hasSkill || inResume || inName || inEmail;
  });

  const handleJobChange = (index, field, value) => {
    const updatedRows = [...jobRows];
    updatedRows[index][field] = value;
    setJobRows(updatedRows);
  };

  const addJobRow = () => {
    setJobRows([...jobRows, { title: '', skillsRequired: '', openings: 1}]);
  }

  const handlePostJob = async(e) => {
    e.preventDefault();
    if(!adminId) return alert("You must be logged in as an admin.");

    try {
      const response = await fetch('https://resumatch-ats-platform.onrender.com/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          recruiterId: adminId,
          jobs: jobRows
        })
      });

      if (response.ok) {
        alert("All jobs posted successfully!");
        // Reset the form back to a single row
        setJobRows([{ title: '', skillsRequired: '', openings: 1}]);
      }
    }
    catch (error) {
      console.error("Error posting jobs: ", error);
    }
  }

  const highlightText = (text, highlight) => {
    // If no search term, just return normal text
    if(!highlight.trim()) return text;

    // Clean up the search term so symbols like "C++" don't crash the logic
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Only add a word boundary (\b) if the search term starts with a letter or number.
    const boundary = /^[a-zA-Z0-9]/.test(highlight) ? '\\b' : '';

    // Split the text based on the search term (case-insensitive)
    const regex = new RegExp(`${boundary}(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            // If part matches the search term, wrap it in a yellow highlight
            <mark key={index} className="bg-yellow-300 text-black px-1 rounded font-bold">
              {part}
            </mark>
          ) : (
            // Otherwise, just return normal text
            part
          )
        )}
      </span>
    );
  };

  const toggleStar = async(studentId) => {
    try{
      const response = await fetch('https://resumatch-ats-platform.onrender.com/api/admin/shortlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, studentId})
      });
      const data = await response.json();

      if(data.isStarred) {
        // Add the ID to our local array so the UI updates instantly
        setStarredIds([...starredIds, studentId]);
      }
      else {
        // Remove the ID from our local array
        setStarredIds(starredIds.filter(id => id !== studentId));
      }
    }
    catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    // 1. Guard Clause: Add a safety net for major actions
    if (newStatus === 'Hired') {
      const isConfirmed = window.confirm("Are you sure you want to officially hire this candidate?");
      if (!isConfirmed) return; // Exit early if they cancel
    }
    try {
      const response = await fetch(`https://resumatch-ats-platform.onrender.com/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      // Parse the JSON response from the backend (whether it was a success or error)
      const data = await response.json();

      if (response.ok) {
        // Update the local state so the UI changes instantly!
        setApplicants(applicants.map(app => 
          app.application_id === applicationId ? { ...app, status: newStatus } : app
        ));
      } else {
        // The server was reached, but it rejected the request (e.g., database error)
        alert(`Failed to update status: ${data.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  // Fetch the applicants when the dashboard loads
  useEffect(() => {
    const fetchApplicants = async () => {
      if (!adminId) return;
      try {
        const response = await fetch(`https://resumatch-ats-platform.onrender.com/api/admin/applicants/${adminId}`);
        const data = await response.json();
        setApplicants(data);
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };

    fetchApplicants();
  }, [adminId]);
  
  if (loading) return <div className="p-8 text-center text-xl">Loading talent pool...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Recruiter Dashboard</h1>
        
        <button
          onClick={() => setActiveView(activeView === 'dashboard' ? 'hired' : 'dashboard')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded shadow transition flex items-center gap-2"
        >
          {activeView === 'dashboard' ? '🏆 View Hired Candidates' : '⬅ Back to Dashboard'}
        </button>
      </div>
      {/* --- THE VIEW TOGGLE --- */}
      {activeView === 'dashboard' ? (
        
        <div className="animate-fadeIn">
        {/* --- UPDATED: BULK POST A JOB FORM --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Post New Jobs</h2>
          <form onSubmit={handlePostJob}>
            
            {/* Map through the array to create the rows */}
            {jobRows.map((job, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-end mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-4">
                
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Job Title {index + 1}</label>
                  <input 
                    type="text" 
                    required
                    value={job.title}
                    onChange={(e) => handleJobChange(index, 'title', e.target.value)}
                    placeholder="e.g., Junior React Developer"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Required Skills</label>
                  <input 
                    type="text" 
                    required
                    value={job.skillsRequired}
                    onChange={(e) => handleJobChange(index, 'skillsRequired', e.target.value)}
                    placeholder="e.g., React, Node, SQL"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="w-full md:w-32">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Openings</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={job.openings}
                    onChange={(e) => handleJobChange(index, 'openings', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ))}

            {/* The Control Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button 
                type="button" 
                onClick={addJobRow}
                className="text-blue-600 hover:text-blue-800 font-bold text-sm"
              >
                + Add Another Job
              </button>

              <button 
                type="submit" 
                className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 transition"
              >
                Post All Jobs
              </button>
            </div>

          </form>
        </div>

        {/* --- RECENT APPLICATIONS INBOX --- */}
        {applicants.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-green-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Applications</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 font-bold rounded-tl">Candidate Name</th>
                    <th className="p-3 font-bold">Applied For</th>
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold rounded-tr">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.filter(app => app.status !== 'Hired').map((app) => (
                    <tr key={app.application_id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">
                        {app.full_name || app.email}
                      </td>
                      <td className="p-3 text-blue-700 font-bold">{app.job_title}</td>
                      <td className="p-3 text-gray-500">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 flex items-center">
                        <button 
                          onClick={() => {
                            // Set the search bar to the applicant's name
                            setSearchTerm(app.full_name || app.email);
                            
                            // Smoothly scroll the page down to the candidate cards!
                            window.scrollTo({ 
                              top: document.body.scrollHeight, 
                              behavior: 'smooth' 
                            });
                          }}
                          className="text-purple-600 hover:text-purple-800 font-bold transition mr-8"
                        >
                          View Profile
                        </button>
                        {/* Interactive Status Dropdown */}
                        <select
                          value={app.status || 'New'}
                          onChange={(e) => handleStatusUpdate(app.application_id, e.target.value)}
                          className={`text-xs font-bold py-1 px-2 rounded outline-none border cursor-pointer transition-colors
                            ${app.status === 'Accepted' ? 'bg-green-100 text-green-800 border-green-300' :
                              app.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                              app.status === 'Interview' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'}`}
                        >
                          <option value="New">New</option>
                          <option value="Interview">Interview</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Hired">Hire Candidate 🏆</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* -------------------------------------- */}

        

        {/* --- THE SEARCH BAR UI --- */}
        <div className="mb-8">
          <input 
            type="text" 
            placeholder="Search by skill (e.g., React, Node, DevOps)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />
          <p className="text-sm text-gray-500 mt-2 ml-1">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </p>
        </div>
        {/* ------------------------------- */}
        
        <div className="space-y-6">
          {/* OUTER MAP: Loop through filtered candidates instead of all candidates */}
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="p-6 bg-white rounded-lg shadow border-l-4 border-purple-500">
              
              {/* --- CANDIDATE HEADER WITH ACTION BUTTONS --- */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  {/* Dynamically show name or fallback to email */}
                  <h2 className="text-xl font-bold text-gray-800">
                    {candidate.full_name ? candidate.full_name : candidate.email}
                  </h2>

                  {/* Star Button*/}
                  <button 
                      onClick={() => toggleStar(candidate.id)}
                      className="focus:outline-none"
                      title={starredIds.includes(candidate.id) ? "Remove from Shortlist" : "Add to Shortlist"}
                    >
                      {starredIds.includes(candidate.id) ? (
                        <span className="text-2xl text-yellow-500">★</span> // Filled Star
                      ) : (
                        <span className="text-2xl text-gray-300 hover:text-yellow-400">☆</span> // Empty Star
                      )}
                  </button>

                  {/* Contact Button */}
                  <a 
                    href={`mailto:${candidate.email}?subject=Interview Request from ResuMatch`}
                    className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-1 px-3 rounded border border-gray-300 transition"
                    title="Send Email"
                  >
                    ✉️ Contact
                  </a>
                  
                  {/* If they have a name, show the email underneath in gray */}
                  {candidate.full_name && (
                    <p className="text-sm text-gray-500 mb-1">{candidate.email}</p>
                  )}
                  <p className="text-sm text-gray-500">Joined: {new Date(candidate.created_at).toLocaleDateString()}</p>
                  {/* NEW: Education Field */}
                  {candidate.education && (
                    <p className="text-md font-medium text-purple-700 mt-1">🎓 {candidate.education}</p>
                  )}
                </div>

                {/* Resume and LinkedIn Links */}
                <div className="flex space-x-3">
                  {candidate.linkedin && (
                    <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition">
                      LinkedIn
                    </a>
                  )}
                  {candidate.resume_path && (
                    <a 
                      href={`https://resumatch-ats-platform.onrender.com/${candidate.resume_path.replace(/\\/g, '/')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-purple-600 text-white font-semibold px-4 py-2 rounded shadow hover:bg-purple-700 transition"
                    >
                      View Resume
                    </a>
                  )}
                </div>
              </div>

              {/* AI CANDIDATE SNAPSHOT */}
              {candidate.ai_summary && (
                <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-md shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-indigo-800 font-bold text-sm uppercase tracking-wider">
                      AI Candidate Snapshot
                    </span>
                  </div>
                  <p className="text-sm text-indigo-900 italic font-medium leading-relaxed">
                    "{candidate.ai_summary}"
                  </p>
                </div>
              )}

              {/* --- BIO & SKILLS SECTION --- */}
              {(candidate.bio || candidate.skills) && (
                <div className="mb-6">
                  {candidate.bio && (
                    <p className="text-gray-700 mb-3 italic">"{candidate.bio}"</p>
                  )}
                  
                  {candidate.skills && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.split(',').map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                          {highlightText(skill.trim(), searchTerm)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* ----------------------------------------------- */}

              {/* PORTFOLIO SECTION */}
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-semibold text-gray-700 mb-3">Portfolio Projects:</h3>
                
                {/* INNER MAP: Loop through this specific candidate's projects */}
                {candidate.projects.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No projects added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {candidate.projects.map((project) => (
                        <div key={project.id} className="p-3 bg-white border rounded shadow-sm hover:shadow transition">
                          
                          <h4 className="text-lg font-bold text-blue-600">{project.title}</h4>
                          
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-semibold">Tech:</span> {project.tech_stack}
                          </p>

                          {project.github_link && (
                            <a 
                              href={project.github_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-500 hover:underline mt-2 inline-block font-medium"
                            >
                              View Code &rarr;
                            </a>
                          )}
                        </div>
                      ))}
                    
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="animate-fadeIn">
          <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-yellow-500 bg-linear-to-r from-white to-yellow-50">
            <h2 className="text-2xl font-bold text-yellow-800 mb-6 flex items-center gap-2">
              🏆 Successfully Hired Candidates
            </h2>
            
            {/* Handle the empty state gracefully */}
            {applicants.filter(app => app.status === 'Hired').length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg text-gray-500 italic mb-2">No candidates hired yet.</p>
                <p className="text-sm text-gray-400">Review your Active Pipeline to find your next great hire!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Map out the hired candidates here */}
                {applicants.filter(app => app.status === 'Hired').map(app => (
                  <div key={app.application_id} className="p-5 border border-yellow-200 rounded-lg bg-white shadow-sm hover:shadow transition">
                    <h3 className="font-bold text-xl text-gray-800 mb-1">{app.full_name || app.email}</h3>
                    <p className="text-md font-semibold text-yellow-700 mb-3">{app.job_title}</p>
                    <div className="border-t border-yellow-100 pt-3">
                      <p className="text-xs text-gray-500 font-medium">Hired on: {new Date().toLocaleDateString()}</p>
                      
                      <button 
                        onClick={() => handleStatusUpdate(app.application_id, 'New')}
                        className="mt-2 text-xs text-gray-400 hover:text-red-500 underline transition"
                      >
                        Undo Status
                      </button>
                    </div>
                  </div>
                ))}
                
              </div>
            )}
          </div>
        </div>
        
      )}
    </div>
    );
}