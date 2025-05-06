import { Button } from "./ui/button"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { useAuthStore } from "@/stores/auth.store"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { UserMenu } from "./UserMenu"

const Navbar = () => {
  const location = useLocation()
  const { user } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/lists", label: "Lists" },
    { path: "/practice", label: "Practice" },
  ]

  return (
    <nav className="w-full border-b bg-background/50 backdrop-blur-sm fixed top-0 z-50">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <div className="mr-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
            Lexino
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden ml-auto p-2 rounded-md hover:bg-accent"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 mr-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-all hover:text-primary relative py-1",
                isActivePath(link.path) ? "text-primary scale-105" : "text-muted-foreground"
              )}
            >
              {link.label}
              {isActivePath(link.path) && (
                <span className="absolute inset-x-0 -bottom-[17px] h-1 bg-gradient-to-r from-blue-600/40 to-violet-600/40 rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Auth Buttons and Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <div className="h-5 w-[1px] bg-border mx-2" />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link to="/signin">
                <Button variant="ghost" size="sm" className={cn(
                  "hover:bg-primary/10",
                  isActivePath("/signin") && "bg-primary/10 text-primary"
                )}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className={cn(
                  "bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90",
                  isActivePath("/signup") && "opacity-90"
                )}>
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden">
            <div className="flex flex-col space-y-4 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-all hover:text-primary relative py-2",
                    isActivePath(link.path) ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-4 border-t">
                <ThemeToggle />
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
