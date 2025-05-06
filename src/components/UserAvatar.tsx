import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@supabase/supabase-js"

interface UserAvatarProps {
  user: User | null
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) return null

  // Get initials from full name or email
  const getInitials = () => {
    const fullName = user.user_metadata?.full_name
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    // Fallback to email
    return user.email?.slice(0, 2).toUpperCase() || "??"
  }

  return (
    <Avatar className={className}>
      <AvatarImage 
        src={user.user_metadata?.avatar_url} 
        alt={user.user_metadata?.full_name || user.email}
      />
      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  )
} 