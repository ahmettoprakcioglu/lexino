import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Plus, Brain, Trophy } from "lucide-react"
import { useAuthStore } from '@/stores/auth.store'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          Welcome to Lexino
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your personal language learning companion
        </p>
        {!user && (
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/signin')}>
              Sign In
            </Button>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Word Lists
            </CardTitle>
            <CardDescription>
              Create and organize your vocabulary lists by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/lists')}
            >
              View Lists
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-600" />
              Practice
            </CardTitle>
            <CardDescription>
              Learn and practice your vocabulary effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/practice')}
            >
              Start Practice
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Progress
            </CardTitle>
            <CardDescription>
              Track your learning progress and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/progress')}
            >
              View Progress
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {user && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/create-list')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New List
            </Button>
            <Button variant="outline" onClick={() => navigate('/lists')}>
              View All Lists
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 