import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/UserAvatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Phone, Mail, Globe, X, Loader2 } from "lucide-react"
import { parsePhoneNumberFromString, isValidPhoneNumber, AsYouType } from 'libphonenumber-js'

export default function AccountPage() {
  const { user, updateUserMetadata } = useAuthStore()
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "")
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone || "")
  const [phoneError, setPhoneError] = useState("")
  const [website, setWebsite] = useState(user?.user_metadata?.website || "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleAvatarSelect = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarFile(file)
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const cancelAvatarChange = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    // Reset file input
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null

    try {
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase()
      // Validate extension again as an extra security measure
      if (!['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
        throw new Error('Invalid file type')
      }

      // Delete old avatar if exists
      if (user.user_metadata?.avatar_url) {
        const oldAvatarPath = user.user_metadata.avatar_url.split('/').pop()
        if (oldAvatarPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldAvatarPath])
            .catch(console.error) // Don't throw if delete fails
        }
      }

      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = fileName // No need for avatars/ prefix as it's the bucket name

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true // Change to true to allow overwriting
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    const formatter = new AsYouType('TR') // Default to Turkey, you might want to make this dynamic
    const formattedNumber = formatter.input(value)
    setPhoneNumber(formattedNumber)
    
    // Clear error if field is empty
    if (!value.trim()) {
      setPhoneError("")
      return
    }

    // Validate phone number
    try {
      const phoneNumber = parsePhoneNumberFromString(value, 'TR')
      if (!phoneNumber || !isValidPhoneNumber(value, 'TR')) {
        setPhoneError("Please enter a valid phone number")
      } else {
        setPhoneError("")
      }
    } catch {
      setPhoneError("Please enter a valid phone number")
    }
  }

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user found")

      // Validate phone number before submitting
      if (phoneNumber) {
        try {
          const parsedNumber = parsePhoneNumberFromString(phoneNumber, 'TR')
          if (!parsedNumber || !isValidPhoneNumber(phoneNumber, 'TR')) {
            throw new Error("Please enter a valid phone number")
          }
        } catch {
          throw new Error("Please enter a valid phone number")
        }
      }

      let avatarUrl = user.user_metadata?.avatar_url

      if (avatarFile) {
        avatarUrl = await uploadAvatar()
      }

      const newMetadata = {
        full_name: fullName,
        phone: phoneNumber,
        website: website,
        ...(avatarUrl && {
          avatar_url: avatarUrl,
          custom_avatar_url: avatarUrl
        })
      }

      const { error } = await supabase.auth.updateUser({
        data: newMetadata
      })

      if (error) throw error

      updateUserMetadata(newMetadata)
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!")
      if (avatarFile) {
        setAvatarFile(null)
        setAvatarPreview(null)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    }
  })

  if (!user) return null

  return (
    <div className="container max-w-4xl py-10">
      <Tabs defaultValue="general" className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-6 items-start">
                <div className="flex flex-col gap-4 items-center sm:flex-row">
                  <div className="flex items-center gap-4 relative">
                    <UserAvatar 
                      user={user} 
                      className="h-24 w-24 border-2 border-primary/10"
                    />
                    {avatarPreview && (
                      <div className="relative">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                        />
                        <button
                          onClick={cancelAvatarChange}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                          title="Cancel avatar change"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      className="min-w-[140px]"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Change Avatar'
                      )}
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Check file type
                          const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
                          if (!allowedTypes.includes(file.type)) {
                            toast.error('Please select a valid image file (JPEG or PNG)')
                            e.target.value = '' // Reset input
                            return
                          }

                          // Check file size (5MB)
                          const maxSize = 5 * 1024 * 1024 // 5MB in bytes
                          if (file.size > maxSize) {
                            toast.error('Image size should be less than 5MB')
                            e.target.value = '' // Reset input
                            return
                          }

                          handleAvatarSelect(file)
                        }
                      }}
                    />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Recommended: Square image, at least 400x400px
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: JPEG, PNG • Max size: 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 w-full">
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2 items-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-2.5" />
                      <div className="flex-1 space-y-1">
                        <Input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="+90 (5XX) XXX XX XX"
                          className={phoneError ? "border-destructive" : ""}
                        />
                        {phoneError && (
                          <p className="text-xs text-destructive">{phoneError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Enter your phone number in international format (e.g., +90 501 234 56 78)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0 mt-2.5" />
                      <Input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your language learning preferences and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Preferences settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 