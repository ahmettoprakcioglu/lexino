import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsLoading(true)
      
      // Use Supabase directly for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) throw error
      
      setIsSuccess(true)
      toast.success('Password reset instructions sent to your email')
    } catch (error) {
      console.error('Reset password error:', error)
      if (error instanceof Error && error.message.includes('Email rate limit exceeded')) {
        toast.error('Too many reset attempts. Please try again later.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to send reset instructions')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check Your Email</h1>
            <p className="text-muted-foreground">
              We've sent password reset instructions to your email address.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 rounded-md">
              <p className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">Important Instructions:</p>
              <ol className="list-decimal list-inside text-left text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>Click the link in the email (Note: The link can only be used once)</li>
                <li>You'll be directed to a password update page</li>
                <li>Enter and confirm your new password</li>
                <li>After reset, you'll be redirected to sign in</li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Didn't receive an email? Check your spam folder or
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSuccess(false)}
            >
              Try Again
            </Button>
            <div className="text-sm text-muted-foreground">
              <Link to="/signin" className="hover:text-primary">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset Your Password</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              placeholder="Email"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending Instructions...' : 'Send Instructions'}
          </Button>
          <div className="text-sm text-center">
            <Link
              to="/signin"
              className="hover:text-primary"
            >
              ← Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 