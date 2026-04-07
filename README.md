# NeuroLens v2

NeuroLens v2 is a comprehensive web application designed for analyzing and screening Parkinson's disease through various interactive tests, including Spiral Drawings, Tapping Tests, and Voice recordings. It uses Machine Learning models on the backend to provide metrics and scores.

## Project Structure

The project is divided into two main parts:
- **`frontend/`**: The user interface built with React, Vite, and Tailwind CSS. It connects to Firebase for user authentication and features test interfaces, dashboards, and historical result tracking.
- **`backend/`**: The REST API built with Python and FastAPI. It processes the test data (Spiral, Tap, Voice) and passes it through pre-trained Machine Learning models (`model.pkl`, `motor_model.pkl`) to evaluate the results.

## Prerequisites
- Node.js (for the frontend)
- Python 3.8+ (for the backend)
- Firebase Account (for authentication and Firestore syncing)

## Setup Instructions

### 1. Backend Setup
Navigate to the `backend` directory and set up the Python environment:

```bash
cd backend
python -m venv venv
# Activate the virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

Configure Firebase Admin credentials using environment variables:

- Preferred: set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full service-account JSON string.
- Local fallback: set `FIREBASE_CREDENTIALS_PATH` to a local JSON file path (for example `firebase-credentials.json`).

If you use a `.env` file, keep credential files out of version control.

Start the backend server:
```bash
uvicorn main:app --reload
# The API will be available at http://localhost:8000
```

### 2. Frontend Setup
Navigate to the `frontend` directory and install the dependencies:

```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
# The web app will be available at http://localhost:5173
```

## Features
- **User Authentication**: Secure Login & Registration using Firebase.
- **Dashboard**: Track overall health and performance.
- **Assessments**:
  - **Spiral Test**: Draw a spiral to analyze tremors.
  - **Tap Test**: Test motor function and speed.
  - **Voice Test**: Analyze vocal features for anomalies.
- **Results & History**: Save and view past test scores over time.

## Machine Learning Models
The backend relies on the following models stored in the `backend/model/` and `model/` folders:
- `model.pkl`
- `motor_model.pkl`

*(Note: Ensure you do not change these paths as the `ml_service.py` relies on them for inference).*

## License
MIT License
