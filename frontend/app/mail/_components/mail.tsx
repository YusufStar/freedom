"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AccountSwitcher } from "./account-switcher";
import { ThreadDisplay } from "./thread-display";
import { ThreadList } from "./thread-list";
import SideBar from "./sidebar";
import { UserInfo } from "./user-info";

interface MailProps {
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Manage selected thread/email id shared between ThreadList and ThreadDisplay
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(sizes)}`;
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

      <ResizableHandle withHandle />

      {/* Middle panel: thread list */}
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <Tabs defaultValue="inbox" className="h-full flex flex-col">
          <div className="flex items-center px-4 py-2 border-b border-border">
            <h1 className="text-xl font-bold">Inbox</h1>
            <TabsList className="ml-auto">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="inbox" className="flex-1 overflow-auto">
            <ThreadList selectedId={selectedId} onSelect={setSelectedId} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel: thread display */}
      <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
        <ThreadDisplay selectedId={selectedId} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
} 