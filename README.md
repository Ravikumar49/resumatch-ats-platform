# ResuMatch 🚀 | AI-Powered Applicant Tracking System

**Live Demo:** https://resumatch-ats-platform.vercel.app/

ResuMatch is a full-stack, cloud-deployed Applicant Tracking System (ATS) designed to bridge the gap between recruiters and students. It leverages the Google Gemini AI API to automatically parse uploaded resumes, compare them against job requirements, and generate match percentages and actionable feedback for candidates.

## ✨ Key Features
* **Role-Based Access Control (RBAC):** Distinct, secure portals for Students and Recruiters utilizing local storage session management.
* **AI Resume Parsing:** Integrates with Google Gemini to read PDF resumes and extract candidate skills.
* **Automated Skill Matching:** Instantly calculates a "Match Percentage" by cross-referencing candidate skills with job descriptions.
* **Recruiter Dashboard:** Allows admins to post jobs, view applicants, and move candidates through the hiring pipeline (New -> Interview -> Rejected).
* **Student Dashboard:** Allows students to upload resumes, browse active job postings, apply with one click, and view AI-generated feedback on missing skills.

## 🛠️ Tech Stack & Cloud Architecture
* **Frontend:** React.js, Vite
* **Backend:** Node.js, Express.js
* **Database:** TiDB Serverless (Cloud MySQL)
* **AI Integration:** Google Gemini API
* **Deployment (UI):** Vercel (Configured with SPA rewrite routing)
* **Deployment (API):** Render Web Services (Configured with secure SSL database tunneling)

## 💻 Local Setup & Installation

If you would like to run this project locally on your machine, follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/YourUsername/resumatch-ats-platform.git](https://github.com/YourUsername/resumatch-ats-platform.git)
cd resumatch-ats-platform