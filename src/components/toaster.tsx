import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--color-background)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-border)",
        },
      }}
    />
  )
} 