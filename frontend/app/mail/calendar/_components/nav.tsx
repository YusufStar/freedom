"use client"

// import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePathname, useRouter } from "next/navigation"

interface NavProps {
    isCollapsed: boolean
    links: {
        title: string
        label?: string
        icon: LucideIcon
        path: string
    }[]
}

export function Nav({ links, isCollapsed }: NavProps) {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <div
            data-collapsed={isCollapsed}
            className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
        >
            <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                {links.map((link, index) => {
                    const isActive = pathname === link.path
                    const variant = isActive ? "default" : "ghost"
                    
                    return isCollapsed ? (
                        <Tooltip key={index} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <span
                                    onClick={() => {
                                        if (link.path) {
                                            router.push(link.path)
                                        }
                                    }}
                                    className={cn(
                                        buttonVariants({ variant, size: "icon" }),
                                        "h-9 w-9 cursor-pointer",
                                        isActive &&
                                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                                    )}
                                >
                                    <link.icon className="w-4 h-4" />
                                    <span className="sr-only">{link.title}</span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="flex items-center gap-4">
                                {link.title}
                                {link.label && (
                                    <span className="ml-auto text-muted-foreground">
                                        {link.label}
                                    </span>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <span
                            key={index}
                            onClick={() => {
                                if (link.path) {
                                    router.push(link.path)
                                }
                            }}
                            className={cn(
                                buttonVariants({ variant, size: "sm" }),
                                isActive &&
                                "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                                "justify-start cursor-pointer"
                            )}
                        >
                            <link.icon className="w-4 h-4 mr-2" />
                            {link.title}
                            {link.label && (
                                <span
                                    className={cn(
                                        "ml-auto",
                                        isActive &&
                                        "text-background dark:text-white"
                                    )}
                                >
                                    {link.label}
                                </span>
                            )}
                        </span>
                    )
                })}
            </nav>
        </div>
    )
} 