import { useState } from "react";

export default function ResumeUpload({ userId }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Capture the file when the user selects it
  const handleFileChange = (e) => {
    // e.target.files is an array of all selected files. We just want the first one.
    setFile(e.target.files[0]);
    setMessage(''); // Clear any previous messages
  };

  // 2. Handle the submission
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage("Please select a PDF file first.");
      return;
    }

    setLoading(true);

    // 3. The Magic Envelope: Create FormData and append our data
    const formData = new FormData();
    
    // CRITICAL: The name 'resume' must exactly match what you wrote in 
    // your backend: upload.single('resume')
    formData.append('resume', file); 
    formData.append('userId', userId); 

    try {
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData, 
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Resume uploaded successfully!");
        setFile(null); // Clear the file input
      } else {
        setMessage("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Your Resume</h3>
      
      <form onSubmit={handleUpload} className="flex flex-col space-y-4">
        
        {/* The File Input */}
        <input 
          type="file" 
          accept="application/pdf" // Force the browser to only look for PDFs
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {/* Status Message */}
        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={!file || loading}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-48"
        >
          {loading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>
    </div>
  );
}