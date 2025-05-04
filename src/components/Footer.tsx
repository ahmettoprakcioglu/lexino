import { Link } from "react-router-dom"
import { Github } from "lucide-react"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand and Description */}
          <div className="space-y-4">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Lexino
            </Link>
            <p className="text-sm text-muted-foreground">
              Enhance your vocabulary learning journey with our innovative platform designed for language enthusiasts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/lists" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Word Lists
                </Link>
              </li>
              <li>
                <Link to="/practice" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Practice
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/ahmettoprakcioglu/lexino"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Lexino. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 