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
import { useAuthStore } from "@/stores/auth.store"
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const updatePassword = useAuthStore((state) => state.updatePassword)

  // Check if we have a valid reset token
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        console.log("Starting reset token validation")
        
        // Get the token from URL params
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        
        console.log("Token present:", !!token)
        console.log("Type:", type)
        
        if (!token) {
          console.error("Missing token")
          toast.error("Invalid password reset link. Please request a new one. (Error: Missing token)")
          navigate("/forgot-password")
          return
        }

        // First sign out to clear any existing session
        console.log("Signing out existing session")
        await supabase.auth.signOut()

        try {
          // Exchange the recovery token
          console.log("Exchanging recovery token")
          const { data, error } = await supabase.auth.exchangeCodeForSession(token)

          if (error) {
            console.error("Token exchange error:", error)
            throw error
          }

          console.log("Token exchanged successfully:", !!data?.session)
          
          if (!data?.session) {
            console.error("No session after token exchange")
            throw new Error("Failed to establish session")
          }

          console.log("Session established successfully")
        } catch (error) {
          console.error("Exchange error:", error)
          toast.error("Password reset link has expired. Please request a new one. (Error: Invalid token)")
          navigate("/forgot-password")
          return
        }

      } catch (error) {
        console.error('Error in checkResetToken:', error)
        toast.error("An error occurred. Please try again. (Error: Validation failed)")
        navigate("/forgot-password")
      }
    }

    checkResetToken()
  }, [navigate, searchParams])

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Starting password update")
      // Update the password
      await updatePassword(data.password)
      // Immediately sign out after password update
      await supabase.auth.signOut()
      console.log("Password update completed")
    },
    onSuccess: () => {
      setIsSuccess(true)
      console.log("Password update successful, redirecting soon")
      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        navigate("/signin")
      }, 3000)
    },
    onError: (error) => {
      console.error("Password update error:", error)
      if (error instanceof Error && error.message.includes('same password')) {
        toast.error("New password must be different from your current password")
        form.reset()
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to reset password")
      }
    },
  })

  const onSubmit = (data: FormData) => {
    updatePasswordMutation.mutate(data)
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
                {updatePasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 