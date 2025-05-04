import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon, CheckCircle2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form } from "@/components/ui/form"
import { FormError } from "@/components/ui/form-error"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Please enter your new password")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match. Please try again.",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        setIsLoading(true)

        // Get the hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        // First check hash parameters (Supabase sometimes puts tokens in hash)
        let access_token = hashParams.get('access_token')
        let refresh_token = hashParams.get('refresh_token')
        let type = hashParams.get('type')

        // If not in hash, check query parameters
        if (!access_token) {
          access_token = searchParams.get('access_token')
          refresh_token = searchParams.get('refresh_token')
          type = searchParams.get('type')
        }

        // Get the error parameter from URL if any
        const errorDescription = searchParams.get('error_description')
        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription))
          navigate('/forgot-password')
          return
        }

        // Check if we have a recovery token
        if (!access_token || !type || type !== 'recovery') {
          console.log('Missing required parameters:', { access_token, type })
          toast.error('Invalid password reset link')
          navigate('/forgot-password')
          return
        }

        // Set the session using the tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        })

        if (sessionError) {
          throw sessionError
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Password reset error:', error)
        toast.error('Invalid or expired reset link')
        navigate('/forgot-password')
      }
    }

    handlePasswordReset()
  }, [navigate, searchParams])

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) throw error

      // Sign out after password change
      await supabase.auth.signOut()
    },
    onSuccess: () => {
      setIsSuccess(true)
      toast.success("Password updated successfully")
      setTimeout(() => {
        navigate("/signin", { replace: true })
      }, 3000)
    },
    onError: (error) => {
      console.error("Password update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    },
  })

  const onSubmit = (data: FormData) => {
    updatePasswordMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">
              Verifying Reset Link...
            </CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your password reset request.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Password Reset Complete</CardTitle>
            <CardDescription className="text-center">
              Your password has been reset successfully. You will be redirected to the sign in page in a few seconds.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Set New Password
          </CardTitle>
          <CardDescription className="text-center">
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-6">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    className={`pr-10 transition-all duration-300 ${form.formState.errors.password ? "input-error" : ""}`}
                    disabled={updatePasswordMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FormError message={form.formState.errors.password?.message} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    {...form.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className={`pr-10 transition-all duration-300 ${form.formState.errors.confirmPassword ? "input-error" : ""}`}
                    disabled={updatePasswordMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FormError message={form.formState.errors.confirmPassword?.message} />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 