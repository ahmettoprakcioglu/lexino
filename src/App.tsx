import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import './App.css'
import { ThemeProvider } from './components/theme-provider'
import SignUpPage from './pages/SignUp'
import SignInPage from './pages/SignIn'
import ForgotPasswordPage from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import { AppProvider } from './providers/app-provider'
import { useAuthStore } from './stores/auth.store'
import { Toaster } from './components/toaster'
import { Loader2 } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lexino-theme">
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8 pt-24">
              <Routes>
                <Route path="/" element={<div>Home Page</div>} />
                <Route path="/list" element={
                  <ProtectedRoute>
                    <div>List Page</div>
                  </ProtectedRoute>
                } />
                <Route path="/practice" element={
                  <ProtectedRoute>
                    <div>Practice Page</div>
                  </ProtectedRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <SignUpPage />
                  </PublicRoute>
                } />
                <Route path="/signin" element={
                  <PublicRoute>
                    <SignInPage />
                  </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                } />
                <Route path="/reset-password" element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                } />
                <Route path="/auth/callback" element={<AuthCallback />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
