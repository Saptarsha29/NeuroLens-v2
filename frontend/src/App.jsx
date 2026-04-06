import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VerificationProvider } from './contexts/VerificationContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import VerificationGuard from './components/VerificationGuard'

// Define route constants to avoid magic strings
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  TESTS: '/tests',
  RESULTS: '/results',
  HISTORY: '/history',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile'
}

// Lazy load page components for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const EmailVerification = lazy(() => import('./pages/EmailVerification'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const History = lazy(() => import('./pages/History'))
const Results = lazy(() => import('./pages/Results'))
const TestsPage = lazy(() => import('./tests/TestsPage'))
const Profile = lazy(() => import('./pages/Profile'))

function AppContent() {
  const location = useLocation()
  const hideNavbar = [ROUTES.DASHBOARD, ROUTES.TESTS, ROUTES.PROFILE].includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col relative">
      {!hideNavbar && (
        <div className="absolute top-0 left-0 right-0 z-50 pt-4">
          <Navbar />
        </div>
      )}
      <main className={`flex-1 ${!hideNavbar && location.pathname !== ROUTES.HOME ? 'mt-16' : ''}`}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
            Loading...
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<EmailVerification />} />
            <Route path={ROUTES.TESTS} element={<TestsPage />} />
            <Route path={ROUTES.RESULTS} element={<Results />} />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.PROFILE} element={<Profile />} />
            </Route>

            {/* Verification Guard routes - require specific verification/roles */}
            <Route element={<VerificationGuard />}>
              <Route path={ROUTES.HISTORY} element={<History />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <VerificationProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </VerificationProvider>
    </AuthProvider>
  )
}
