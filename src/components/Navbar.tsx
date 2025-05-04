import { Button } from "./ui/button"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../lib/utils"
import { ThemeToggle } from "./theme-toggle"

const Navbar = () => {
  const location = useLocation()

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="w-full border-b bg-background/50 backdrop-blur-sm fixed top-0 z-50">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <div className="mr-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
            Lexino
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-8 mr-auto">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-all hover:text-primary relative py-1",
              isActivePath("/") ? "text-primary scale-105" : "text-muted-foreground"
            )}
          >
            Home
            {isActivePath("/") && (
              <span className="absolute inset-x-0 -bottom-[17px] h-1 bg-gradient-to-r from-blue-600/40 to-violet-600/40 rounded-full" />
            )}
          </Link>
          <Link 
            to="/list" 
            className={cn(
              "text-sm font-medium transition-all hover:text-primary relative py-1",
              isActivePath("/list") ? "text-primary scale-105" : "text-muted-foreground"
            )}
          >
            List
            {isActivePath("/list") && (
              <span className="absolute inset-x-0 -bottom-[17px] h-1 bg-gradient-to-r from-blue-600/40 to-violet-600/40 rounded-full" />
            )}
          </Link>
          <Link 
            to="/practice" 
            className={cn(
              "text-sm font-medium transition-all hover:text-primary relative py-1",
              isActivePath("/practice") ? "text-primary scale-105" : "text-muted-foreground"
            )}
          >
            Practice
            {isActivePath("/practice") && (
              <span className="absolute inset-x-0 -bottom-[17px] h-1 bg-gradient-to-r from-blue-600/40 to-violet-600/40 rounded-full" />
            )}
          </Link>
        </div>

        {/* Auth Buttons and Theme Toggle */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="h-5 w-[1px] bg-border mx-2" />
          <Button variant="ghost" size="sm" className="hover:bg-primary/10">
            Sign In
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90">
            Sign Up
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
