import express, { application } from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware: Allow React to talk, and allows to read JSON data
const app = express();
app.use(cors());
app.use(express.json());
// This tells Express to make the 'uploads' folder publicly readable
app.use('/uploads', express.static('uploads'));



// Configure where and how Multer saves the files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // This tells Multer to save files in the 'uploads' directory
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Combines the unique string with the original file extension (e.g., .pdf)
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Security check: Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});



// Create the MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: true
  }
});

// Test the connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  console.log('Successfully connected to MySQL database!');
});

// Start the backend server on port 5000
const PORT = 5000;

// --- API ENDPOINTS ---

app.post('/api/user/profile', (req, res) => {
  const { userId, fullName, bio, skills, education, linkedin } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  const sql = `
    INSERT INTO student_profiles (user_id, full_name, bio, skills, education, linkedin) 
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    full_name = VALUES(full_name), bio = VALUES(bio), skills = VALUES(skills), education = VALUES(education), linkedin = VALUES(linkedin)
  `;

  db.query(sql, [userId, fullName, bio, skills, education, linkedin], (err, result) => {
    if (err) {
      console.error("Database error updating profile:", err);
      return res.status(500).json({ error: "Failed to save profile details." });
    }
    
    res.json({ success: true, message: "Profile saved in dedicated table!" });
  });
});

// GET user profile data (Student action)
app.get('/api/user/profile/:id', (req, res) => {
  const userId = req.params.id;
  
  const sql = "SELECT * FROM student_profiles WHERE user_id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // THE SAFETY NET: If the array is empty, it's a new user!
    // Send back an empty object instead of crashing.
    if (results.length === 0) {
      return res.json({}); 
    }

    // If they do have a profile, send it safely
    res.json(results[0]);
  });
});

// User Registration (Signup) Endpoint - WITH SECRET ADMIN KEY
app.post('/api/signup', (req, res) => {
  // Notice we are now also accepting an 'adminCode' from the frontend
  const { email, password, adminCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const checkEmailSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error("Database error checking email:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    let assignedRole = 'student'; // Default everyone to student
    const SECRET_RECRUITER_KEY = 'HIREME2026'; // Only the recruiters know this!

    if (adminCode === SECRET_RECRUITER_KEY) {
      assignedRole = 'admin'; // Upgrade them!
    }

    // Insert the user with their newly calculated role
    const insertSql = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
    db.query(insertSql, [email, password, assignedRole], (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Database error inserting user:", insertErr);
        return res.status(500).json({ success: false, message: "Failed to create account." });
      }

      res.json({ 
        success: true, 
        message: "Account created successfully!",
        userId: insertResult.insertId,
        role: assignedRole // Send the role back so React knows where to route them
      });
    });
  });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Ask MySQL if this user exists
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      // User found! Send back their role so React knows where to send them
      const user = results[0];
      res.json({ success: true, role: user.role, id: user.id });
    } else {
      // No match found
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  });
});

// Add a New Project Endpoint
app.post('/api/projects', (req, res) => {
  // Extract the data sent from the React frontend
  const { user_id, title, tech_stack, github_link } = req.body;

  // Basic validation to ensure they didn't send blank required fields
  if (!user_id || !title || !tech_stack) {
    return res.status(400).json({ success: false, message: "Please fill in all required fields." });
  }

  // The '?' are security placeholders to prevent SQL Injection hacking
  const sql = "INSERT INTO projects (user_id, title, tech_stack, github_link) VALUES (?, ?, ?, ?)";
  
  db.query(sql, [user_id, title, tech_stack, github_link], (err, result) => {
    if (err) {
      console.error("Database error adding project:", err);
      return res.status(500).json({ success: false, message: "Failed to save project to database." });
    }
    // result.insertId gives us the new ID generated by MySQL
    res.json({ success: true, message: "Project added successfully!", projectId: result.insertId });
  });
});

// Fetch a Student's Projects Endpoint
app.get('/api/projects/:userId', (req, res) => {
  // Grab the userId from the URL (e.g., /api/projects/2)
  const userId = req.params.userId;

  // Fetch their projects, newest first
  const sql = "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC";
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Database error fetching projects:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch projects." });
    }
    // Send the array of projects back to React
    res.json({ success: true, projects: results });
  });
});

app.get('/api/admin/candidates', (req, res) => {
  // 1. Get all students AND their profile details using a LEFT JOIN
  const sql = `
    SELECT 
      u.id, 
      u.email, 
      u.created_at,
      sp.full_name,
      sp.bio, 
      sp.skills, 
      sp.education, 
      sp.linkedin, 
      sp.resume_path,
      sp.resume_text,
      sp.ai_summary,
      sp.ai_skills
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'student'
  `;

  db.query(sql, (err, users) => {
    if (err) {
      console.error("Error fetching users and profiles:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    // 2. Get all projects (This stays exactly the same!)
    const projectsSql = "SELECT * FROM projects ORDER BY created_at DESC";
    
    db.query(projectsSql, (err, projects) => {
      if (err) {
        console.error("Error fetching projects:", err);
        return res.status(500).json({ error: "Failed to fetch projects" });
      }

      // 3. Combine the combined User/Profile data with their Projects
      const candidates = users.map(user => {
        const userProjects = projects.filter(project => project.user_id === user.id);
        return {
          ...user,
          projects: userProjects
        };
      });

      // Send the ultimate data package to React
      res.json(candidates);
    });
  });
});

app.post('/api/upload-resume', (req, res, next) => {
  upload.single('resume')(req, res, function (err) {
    if (err) {
      console.error("MULTER CRASHED:", err);
      return res.status(500).json({ error: "Multer failed: " + err.message });
    }
    next(); 
  });
}, async (req, res) => {
  
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const userId = req.body.userId;
  const filePath = req.file.path;

  try {
    // Read the raw PDF file from the uploads folder
    const dataBuffer = fs.readFileSync(filePath);

    const parser = new PDFParse({ data: dataBuffer });
    
    // Pass it to pdf-parse to extract the text
    const parsedData = await parser.getText();
    const extractedText = parsedData.text;
    
    console.log("PDF Parsed successfully! Asking Gemini to analyze");

    // The AI Prompt (for skills and summary)
    const prompt = `
      You are an expert ATS system. Analyze the following resume text. 
      Extract all technical skills into a normalized array.
      Write a 2-sentence professional summary of the candidate.
      
      You MUST return your response strictly as a valid JSON object with the exact keys: 'skills' and 'summary'. 
      Do not include markdown formatting, backticks, or any other conversational text.
      
      Resume Text:
      ${extractedText}
    `;

    // Call the Gemini API
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);

    // Clean and parse the AI's response
    let aiResultText = result.response.text().trim();
    // Safety net: Strip out markdown formatting if Gemini accidentally includes it
    aiResultText = aiResultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(aiResultText);

    console.log("AI Analysis Complete!", aiData);

    // Convert the array back to a string for MySQL storage
    const skillsString = aiData.skills.join(', ');

    // Save everything to the database
    const sql = `
      INSERT INTO student_profiles (user_id, resume_path, resume_text, ai_skills, ai_summary) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      resume_path = VALUES(resume_path), resume_text = VALUES(resume_text),
      ai_skills = VALUES(ai_skills), ai_summary = VALUES(ai_summary)
    `;
    
    db.query(sql, [userId, filePath, extractedText, skillsString, aiData.summary], (err, result) => {
      if (err) {
        console.error("DATABASE CRASHED:", err.message);
        return res.status(500).json({ error: "Database failed." });
      }

      res.json({ success: true, message: "Resume uploaded, parsed and analyzed by AI!", path: filePath });
    });

  } catch (parseError) {
    console.error("PIPELINE FAILED:", parseError);
    return res.status(500).json({ error: "Failed to process Resume." });
  }
});

// Fetch all the shortlist student IDs for a specific admin
app.get('/api/admin/shortlist/:adminId', (req, res) => {
  const sql = "SELECT student_id FROM shortlists WHERE admin_id = ?";
  db.query(sql, [req.params.adminId], (err, results) => {
    if(err) return res.status(500).json({ error: "Database error"});
    const ids = results.map(row => row.student_id);
    res.json(ids);
  });
});

// Toggle a shortlist
app.post('/api/admin/shortlist/toggle', (req,res) => {
  const { adminId, studentId} = req.body;

  // Check if it already exists
  const checkSql = "SELECT * FROM shortlists WHERE admin_id = ? AND student_id = ?";
  db.query(checkSql, [adminId, studentId], (err, results) => {
    if(err) return res.status(500).json({ error: "Database error"});

    if(results.length > 0) {
      // It exists and now the recruiter is un-starring them. Delete the row.
      const deleteSql = "DELETE FROM shortlists WHERE admin_id = ? AND student_id = ?";
      db.query(deleteSql, [adminId, studentId], (err) => {
        if(err) return res.status(500).json({ error: "Failed to remove" });
        res.json({ isStarred: false});
      });
    }
    else {
      // It doesn't exist and the recruiter is starring them. Insert the new row.
      const insertSql = "INSERT INTO shortlists (admin_id, student_id) VALUES (?, ?)";
      db.query(insertSql, [adminId, studentId], (err) => {
        if(err) return res.status(500).json({ error: "Failed to save" });
        res.json({ isStarred: true});
      });
    }
  });
});

// POST a new job (Recruiter action)
app.post('/api/jobs', (req, res) => {
  const { recruiterId, jobs } = req.body;

  if(!jobs || jobs.length === 0) {
    return res.status(400).json( { error: "No jobs provided."} );
  }

  const values = jobs.map(job => [
    recruiterId,
    job.title,
    job.skillsRequired,
    job.openings
  ]);

  const sql = "INSERT INTO jobs (recruiter_id, title, skills_required, openings) VALUES ?";
  
  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error posting job:", err);
      return res.status(500).json({ error: "Failed to post job." });
    }
    res.json({ message: `Success ${result.affectedRows} jobs posted.`});
  });
});

// Get jobs a specific student has applied for
app.get('/api/applications/:studentId', (req,res) => {
  const { studentId } = req.params;

  const sql = `
    SELECT
      a.id AS application_id,
      j.id AS job_id,
      a.applied_at,
      j.title,
      j.skills_required,
      a.status,
      a.missing_skills,
      u.email AS recruiter_email
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON j.recruiter_id = u.id
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC`;

  db.query(sql, [studentId], (err, results) => {
    if(err) {
      console.error("Error fetching applications: ", err);
      return res.status(500).json({ error: "Failed to fetch applications" });
    }
    res.json(results);
  });
});


// GET all jobs (Student action)
app.get('/api/jobs', (req, res) => {
  // We order by created_at DESC so the newest jobs show up at the top!
  const sql = `SELECT j.*, u.email AS recruiter_email
      FROM jobs j
      JOIN users u ON j.recruiter_id = u.id
      ORDER BY j.created_at DESC`;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching jobs:", err);
      return res.status(500).json({ error: "Failed to fetch jobs." });
    }
    res.json(results);
  });
});

// POST an application (Student action)
app.post('/api/jobs/apply', (req, res) => {
  const { jobId, studentId } = req.body;

  const sql = "INSERT INTO applications (job_id, student_id) VALUES (?, ?)";
  
  db.query(sql, [jobId, studentId], (err, result) => {
    if (err) {
      // Catch the exact error if they try to apply twice
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "You have already applied for this job!" });
      }
      console.error("Error applying for job:", err);
      return res.status(500).json({ error: "Failed to submit application." });
    }
    res.json({ message: "Application submitted successfully!" });
  });
});


// GET applicants for a specific recruiter's jobs
app.get('/api/admin/applicants/:recruiterId', (req, res) => {
  const sql = `
    SELECT 
      a.id AS application_id, 
      a.applied_at, 
      j.title AS job_title, 
      u.email, 
      sp.full_name, 
      sp.skills,
      a.status
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.student_id = u.id
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE j.recruiter_id = ?
    ORDER BY a.applied_at DESC
  `;
  
  db.query(sql, [req.params.recruiterId], (err, results) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Failed to fetch applicants" });
    }
    res.json(results);
  });
});

app.put('/api/applications/:applicationId/status', (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body; // Expecting 'Accepted' or 'Rejected' 
  
  // If the recruiter clicked REJECT, calculate the missing skills!
  if (status === 'Rejected') {
    // 1. Fetch both the Job's required skills and the Student's actual skills
    const fetchSql = `
      SELECT j.skills_required, sp.skills AS student_skills
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN student_profiles sp ON a.student_id = sp.user_id
      WHERE a.id = ?
    `;

    db.query(fetchSql, [applicationId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ error: "Failed to fetch application data" });
      }

      // 2. Convert comma-separated strings to lowercase arrays for easy math
      const jobSkills = results[0].skills_required 
        ? results[0].skills_required.split(',').map(s => s.trim().toLowerCase()) 
        : [];
      const studentSkills = results[0].student_skills 
        ? results[0].student_skills.split(',').map(s => s.trim().toLowerCase()) 
        : [];

      // 3. The Algorithm: Keep only the skills the student DOES NOT have
      const missingSkillsArr = jobSkills.filter(skill => !studentSkills.includes(skill));
      
      // Convert the missing skills back into a capitalized, readable string
      const missingSkillsStr = missingSkillsArr.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');

      // 4. Save both the 'Rejected' status AND the calculated missing skills
      const updateSql = "UPDATE applications SET status = ?, missing_skills = ? WHERE id = ?";
      db.query(updateSql, [status, missingSkillsStr, applicationId], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: "Failed to update status and feedback" });
        res.json({ message: `Application rejected. Missing skills logged: ${missingSkillsStr}` });
      });
    });
  }
  // For 'Hired', 'Interview', etc.
  else {
    const sql = "UPDATE applications SET status = ? WHERE id = ?";
    db.query(sql, [status, applicationId], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to update status" });
      return res.json({ message: `Application marked as ${status}` });
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});