# ResuMatch 🚀
**An AI-Powered Applicant Tracking System (ATS) & Student Portfolio Platform**

ResuMatch is a full-stack web application designed to bridge the gap between computer science students and recruiters. It uses Google's Gemini AI to automatically parse uploaded resumes, extract technical skills, generate candidate summaries, and dynamically calculate job match percentages.

## 🛠 Tech Stack
* **Frontend:** React.js, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **Artificial Intelligence:** Google Generative AI (Gemini 2.5 Flash)
* **Utilities:** Multer (File Uploads), PDF-Parse (Resume reading)

---

## ✨ Core Features

### For Recruiters (Admins)
* **Smart Dashboard & Pipeline:** Toggle between an Active Pipeline of new candidates and a "Wall of Fame" for successfully hired students.
* **Bulk Job Posting:** Dynamically post multiple job openings with required tech stacks in a single action.
* **AI Candidate Snapshots:** Automatically view a Gemini-generated professional summary and verified tech stack extracted directly from the student's PDF resume.
* **Real-Time Smart Search:** Filter the talent pool instantly. The search engine cross-references manual skills, AI-extracted skills, and raw resume text.
* **Application Tracking:** Move candidates through a realistic ATS pipeline (New -> Interview -> Accepted -> Hired -> Rejected).
* **Automated Feedback:** When a candidate is rejected, the system automatically calculates the exact "Missing Skills" they need to improve their profile.

### For Students
* **Portfolio Management:** Add and manage custom coding projects, complete with tech stacks and GitHub links.
* **Live Job Board:** View open opportunities and see exactly which company/recruiter posted them.
* **Dynamic Match Scoring:** The platform automatically calculates a Match Percentage for every job based on the student's AI-verified skills.
* **Application History:** Track the real-time status of applied jobs.
* **Actionable Rejection Feedback:** Receive automated tips on which specific skills to learn if an application is rejected.

---

## 💻 Local Installation & Setup

Follow these steps to run the ResuMatch platform on your local machine.

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/Ravikumar49/resumatch-ats-platform.git
cd resumatch-ats-platform
\`\`\`

### 2. Database Setup (MySQL)
1. Open MySQL Workbench.
2. Create an empty database named `resumatch_db`.
3. Import the provided `database.sql` file (located in the backend folder) into `resumatch_db` to automatically generate all required tables (users, student_profiles, projects, jobs, applications, shortlists).

### 3. Backend Setup
1. Open a terminal and navigate to the `backend` folder.
2. Install the required Node dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a `.env` file in the root of the `backend` folder and add your credentials:
   \`\`\`env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=resumatch_db
   \`\`\`
4. Start the backend server:
   \`\`\`bash
   node server.js
   \`\`\`
   *(The server will run on https://resumatch-ats-platform.onrender.com)*

### 4. Frontend Setup
1. Open a **new** terminal window and navigate to the root/frontend folder.
2. Install the React dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the Vite development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   *(The app will open on http://localhost:5173)*

---

## 🔑 Demo Access / Roles
To test the platform, you can sign up for a new account on the login screen. 
* **Student:** Standard signup creates a student account.
* **Recruiter:** To create an Admin/Recruiter account, enter the secret access code `HIREME2026` during the signup process.
