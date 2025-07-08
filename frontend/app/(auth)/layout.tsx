"use client"

import { useRequireGuest } from "@/hooks/use-auth"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useRequireGuest()

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}