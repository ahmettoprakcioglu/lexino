import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import './App.css'
import { ThemeProvider } from './components/theme-provider'
import SignUpPage from './pages/SignUp'
import SignInPage from './pages/SignIn'
import { AppProvider } from './providers/app-provider'
import { useAuthStore } from './stores/auth.store'
import { Toaster } from './components/toaster'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/signin" />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (user) {
    return <Navigate to="/" />
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
