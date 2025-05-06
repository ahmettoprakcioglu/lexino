import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "./UserAvatar"
import { User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth.store"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Settings, User as UserIcon, LogOut } from "lucide-react"

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)

  const signOutMutation = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      toast.success("Successfully signed out!")
      navigate("/signin")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to sign out")
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none">
          <UserAvatar user={user} className="h-8 w-8 cursor-pointer hover:opacity-90" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => navigate("/account")}
            className="cursor-pointer"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/account/settings")}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOutMutation.mutate()}
          disabled={signOutMutation.isPending}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{signOutMutation.isPending ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 