import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (data?.session) {
          // If we have a session, the user is authenticated
          navigate('/', { replace: true })
        } else {
          // No session means something went wrong
          toast.error('Authentication failed. Please try again.')
          navigate('/signin', { replace: true })
        }
      } catch (error) {
        console.error('Error in auth callback:', error)
        toast.error('Authentication failed. Please try again.')
        navigate('/signin', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-2">Verifying...</h2>
        <p className="text-muted-foreground">Please wait while we verify your request.</p>
      </div>
    </div>
  )
} 