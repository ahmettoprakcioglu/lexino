import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import './App.css'
import { ThemeProvider } from './components/theme-provider'
import SignUpPage from './pages/SignUp'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lexino-theme">
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8 pt-24">
            <Routes>
              <Route path="/" element={<div>Home Page</div>} />
              <Route path="/list" element={<div>List Page</div>} />
              <Route path="/practice" element={<div>Practice Page</div>} />
              <Route path="/signup" element={<SignUpPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
