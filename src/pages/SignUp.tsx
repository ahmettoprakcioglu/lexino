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
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form } from "@/components/ui/form"
import { FormError } from "@/components/ui/form-error"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { GoogleAuthButton } from "@/components/GoogleAuthButton"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const signUpSchema = z.object({
  fullName: z.string().min(1, "Please enter your full name"),
  email: z.string().min(1, "Please enter your email address").email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Please enter your password")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  terms: z.boolean().refine((val) => val === true, "Please accept the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match. Please try again.",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const handleAvatarSelect = (file: File) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG)')
      return
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null

    try {
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase()
      // Validate extension again as an extra security measure
      if (!['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
        throw new Error('Invalid file type')
      }

      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
      return null
    }
  }

  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      if (!authData?.user) throw new Error('Failed to create account')

      // Upload avatar if selected
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(authData.user.id)
        if (avatarUrl) {
          await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl }
          })
        }
      }

      return authData
    },
    onSuccess: () => {
      toast.success("Account created successfully! Please check your email to verify your account.")
      navigate("/signin")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create account")
    },
  })

  const onSubmit = (data: FormData) => {
    signUpMutation.mutate(data)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Profile Picture (Optional)
                </label>
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/10">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-xl bg-primary/5 text-primary">
                      {form.getValues("fullName")
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center w-full space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full max-w-[200px]"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      Choose File
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleAvatarSelect(file)
                      }}
                      disabled={signUpMutation.isPending}
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      {avatarFile ? avatarFile.name : 'No file chosen'}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Accepted formats: JPEG, PNG • Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Full Name
                </label>
                <Input
                  {...form.register("fullName")}
                  placeholder="John Doe"
                  className={cn(
                    "transition-all duration-300",
                    form.formState.errors.fullName && "border-destructive"
                  )}
                  disabled={signUpMutation.isPending}
                />
                <FormError message={form.formState.errors.fullName?.message} />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Email
                </label>
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="john@example.com"
                  className={cn(
                    "transition-all duration-300",
                    form.formState.errors.email && "border-destructive"
                  )}
                  disabled={signUpMutation.isPending}
                />
                <FormError message={form.formState.errors.email?.message} />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Password
                </label>
                <div className="relative">
                  <Input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={cn(
                      "pr-10 transition-all duration-300",
                      form.formState.errors.password && "border-destructive"
                    )}
                    disabled={signUpMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                <label className="text-sm font-medium leading-none">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    {...form.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className={cn(
                      "pr-10 transition-all duration-300",
                      form.formState.errors.confirmPassword && "border-destructive"
                    )}
                    disabled={signUpMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  {...form.register("terms")}
                  className={cn(
                    form.formState.errors.terms && "border-destructive"
                  )}
                  disabled={signUpMutation.isPending}
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                  <FormError message={form.formState.errors.terms?.message} />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending ? "Creating Account..." : "Sign Up"}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <GoogleAuthButton />
              
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/signin" className="text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 