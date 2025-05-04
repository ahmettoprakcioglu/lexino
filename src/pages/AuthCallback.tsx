import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"

type AuthStatus = "loading" | "success" | "error" | "expired"

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get error type and message from URL if they exist
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (error) {
          // Handle specific error cases
          if (error === "expired_token") {
            setStatus("expired")
          } else {
            setStatus("error")
            setErrorMessage(errorDescription || "Authentication failed")
          }
          return
        }

        // Try to exchange the code for a session
        const { error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setStatus("error")
          setErrorMessage(sessionError.message)
          return
        }

        setStatus("success")
        // Redirect to home after 3 seconds on success
        setTimeout(() => {
          navigate("/")
        }, 3000)
      } catch (err) {
        setStatus("error")
        setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Verifying...
            </CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your authentication.
            </CardDescription>
          </>
        )

      case "success":
        return (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Authentication Successful
            </CardTitle>
            <CardDescription className="text-center">
              You have been successfully authenticated. You will be redirected shortly.
            </CardDescription>
          </>
        )

      case "expired":
        return (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Link Expired
            </CardTitle>
            <CardDescription className="text-center">
              This authentication link has expired. Please request a new one.
            </CardDescription>
          </>
        )

      case "error":
        return (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Authentication Failed
            </CardTitle>
            <CardDescription className="text-center">
              {errorMessage || "An error occurred during authentication."}
            </CardDescription>
          </>
        )
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          {renderContent()}
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          {(status === "error" || status === "expired") && (
            <>
              <Link to="/signin" className="w-full">
                <Button
                  variant="default"
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                >
                  Back to Sign In
                </Button>
              </Link>
              {status === "expired" && (
                <Link to="/forgot-password" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Request New Link
                  </Button>
                </Link>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 