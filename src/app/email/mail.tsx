"use client"

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/ui/resizable";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TooltipProvider } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { AccountSwitcher } from "./account-switcher";

export default function Mail({
    defaultLayout = [20, 32, 48],
    navCollapsedSize = 5,
    defaultIsCollapsed = false,
}: {
    defaultLayout?: number[]
    navCollapsedSize?: number
    defaultIsCollapsed?: boolean
}) {
    const [isCollapsed, setIsCollapsed] = useState(defaultIsCollapsed)

    return <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup direction="horizontal" onLayout={(sizes: number[]) => {
            console.log(sizes)
        }} className="items-stretch h-full min-h-screen">
            <ResizablePanel
                defaultSize={defaultLayout[0]}
                collapsedSize={navCollapsedSize}
                minSize={15}
                maxSize={40}
                onResize={(size) => {
                    setIsCollapsed(false)
                }}
                onCollapse={() => {
                    setIsCollapsed(true)
                }}
                className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
            >
                <div className="flex flex-col h-full flex-1">
                    <div className={cn("flex items-center justify-between h-[52px]", isCollapsed ? "h-[52px]" : "px-2")}>
                        <AccountSwitcher isCollapsed={isCollapsed} />
                    </div>
                    <Separator />
                    Sidebar
                    <div className="flex-1"></div>
                    Ask AI
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
                defaultSize={defaultLayout[1]}
                minSize={30}
            >
                <Tabs defaultValue="inbox">
                    <div className="flex items-center px-4 py-2">
                        <h1 className="text-xl font-bold">Inbox</h1>
                        <TabsList className="ml-auto">
                            <TabsTrigger value="inbox" className="text-zinc-600 dark:text-zinc-200">Inbox</TabsTrigger>
                            <TabsTrigger value="done" className="text-zinc-600 dark:text-zinc-200">Done</TabsTrigger>
                        </TabsList>
                    </div>

                    <Separator />

                    Search bar
                </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
                defaultSize={defaultLayout[2]}
                minSize={30}
            >
                Thread display
            </ResizablePanel>
        </ResizablePanelGroup>
    </TooltipProvider>
}