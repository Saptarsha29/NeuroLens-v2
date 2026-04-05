# 🧠 NeuroLens v2
> **Not just another test. Proactive neurological care.**

NeuroLens v2 is an advanced clinical research web application designed to proactively analyze and screen for early signs of Parkinson's disease. By utilizing modern web technologies and machine learning, NeuroLens enables users to perform interactive Voice and Motor skill tests (Spiral Drawing, Tap Testing) from anywhere, anytime.

---

## ✨ Key Features

* **Interactive Neurological Tests:**
  * **🎙️ Voice Analysis:** Detects vocal tremors and speech pattern changes.
  * **✍️ Spiral Drawing Test:** Tracks hand-eye coordination, trace deviation, and drawing velocity.
  * **👆 Tap Testing:** Measures motor response frequency and rhythm consistency.
* **📊 Advanced Patient Dashboard:**
  * Clean, responsive dashboard tracking historical results.
  * Interactive data visualization for neurological progress over time.
  * Premium UI featuring 3D glowing elements and tailored dark/light aesthetic modes.
* **🔐 Robust Security & Authentication:**
  * Secure Firebase Authentication (Email/Password).
  * **90-Day Forced Verification:** Automatically revokes verification and forces an email OTP challenge if a user hasn't logged in for >90 days.
  * **15-Day Auto-Logout:** Active sessions forcefully terminate if the user hasn't successfully signed in with a password within 15 cumulative days.
* **☁️ Cloud Data Synchronization:**
  * User profiles, historical test results, and analytics securely synced via Firestore.

---

## 🏗️ Project Architecture

* **Frontend (/frontend)**: 
  * React 18, React Router DOM v6
  * Vite (Fast Build Tool)
  * Tailwind CSS (Styling, Custom 3D Filters, Gradients)
  * Context API (AuthContext, VerificationContext)
* **Backend (/backend)**:
  * Python 3.8+, FastAPI
  * Firebase Admin SDK (Authentication Guarding, Firestore Database)
  * Advanced ML Services & Metrics (scikit-learn, custom feature extraction for Voice/Motor tests)

---

## 🚀 Getting Started

### Prerequisites
* Node.js (for the frontend React app)
* Python 3.8+ (for the FastAPI backend)
* Firebase Account (for authentication and Firestore syncing)

### 1. Backend Setup
Navigate to the ackend directory and set up the Python environment:

\\\ash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
env\Scripts\activate
# Mac/Linux:
source env/bin/activate

# Install dependencies
pip install -r requirements.txt
\\\

**Environment Configuration:**
Add your Firebase Admin SDK credential JSON file into the root of the /backend folder (e.g., irebase-credentials.json). 

**Start the Server:**
\\\ash
uvicorn main:app --reload
\\\
*The backend API will run on http://localhost:8000.*

### 2. Frontend Setup
Open a new terminal, navigate to the rontend directory:

\\\ash
cd frontend
npm install
\\\

**Environment Configuration:**
Create a .env file in the /frontend directory and add your Firebase client configuration:
\\\env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
\\\

**Start the Client:**
\\\ash
npm run dev
\\\
*The frontend application will be available at http://localhost:5173.*

---

## 🔒 Security Notice
Do **NOT** commit irebase-credentials.json or .env files to public repositories. They are added to .gitignore by default.
