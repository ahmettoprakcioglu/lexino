import { useState } from "react"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form } from "@/components/ui/form"
import { FormError } from "@/components/ui/form-error"
import { useAuthStore } from "@/stores/auth.store"
import { Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Please enter your email address").email("Please enter a valid email address"),
})

type FormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isEmailSent, setIsEmailSent] = useState(false)
  const resetPassword = useAuthStore((state) => state.resetPassword)

  const form = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (data: FormData) => resetPassword(data.email),
    onSuccess: () => {
      setIsEmailSent(true)
      toast.success("Password reset instructions have been sent to your email")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send reset instructions")
    },
  })

  const onSubmit = (data: FormData) => {
    resetPasswordMutation.mutate(data)
  }

  if (isEmailSent) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We have sent password reset instructions to your email address. Please check your inbox and follow the instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4">
            <Link to="/signin" className="w-full">
              <Button 
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="john@example.com"
                  className={`transition-all duration-300 ${form.formState.errors.email ? "input-error" : ""}`}
                  disabled={resetPasswordMutation.isPending}
                />
                <FormError message={form.formState.errors.email?.message} />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Sending Instructions..." : "Send Instructions"}
              </Button>
              <Link 
                to="/signin"
                className="w-full"
              >
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 