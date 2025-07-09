"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    ResizablePanelGroup,
    ResizablePanel,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { AccountSwitcher } from "../../_components/account-switcher";
import SideBar from "./sidebar";
import { UserInfo } from "../../_components/user-info";

interface CalendarProps {
    defaultLayout?: number[];
    defaultCollapsed?: boolean;
    navCollapsedSize: number;
}

export function Calendar({
    defaultLayout = [20, 32, 48],
    defaultCollapsed = false,
    navCollapsedSize,
}: CalendarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    return (
        <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout:calendar=${JSON.stringify(sizes)}`;
            }}
            className="items-stretch h-full min-h-screen"
        >
            {/* Left Sidebar */}
            <ResizablePanel
                defaultSize={defaultLayout[0]}
                collapsedSize={navCollapsedSize}
                collapsible
                minSize={15}
                maxSize={40}
                onCollapse={() => {
                    setIsCollapsed(true);
                    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
                }}
                onResize={() => {
                    setIsCollapsed(false);
                    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
                }}
                className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
            >
                <div className="flex flex-col h-full flex-1">
                    {/* Top: account switcher */}
                    <div className={cn("flex h-[52px] items-center justify-center", isCollapsed ? "h-[52px]" : "px-2")}>
                        <AccountSwitcher isCollapsed={isCollapsed} />
                    </div>
                    <Separator />
                    {/* Navigation */}
                    <SideBar isCollapsed={isCollapsed} />
                    <div className="flex-1" />
                    {/* Bottom: user info */}
                    <UserInfo isCollapsed={isCollapsed} />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
} 