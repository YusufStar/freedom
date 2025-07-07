"use client"
import dynamic from "next/dynamic"
import { ModeToggle } from "~/components/theme-toggle"

const Mail = dynamic(() => {
    return import("./mail")
}, { ssr: false })

export default function MailDashboard() {
    return <>
        <div className="absolute bottom-4 right-4">
            <ModeToggle />
        </div>

    <Mail 
        defaultLayout={[20, 32, 48]}
        navCollapsedSize={4}
        defaultIsCollapsed={false}
    /></>
}