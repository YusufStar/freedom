"use client";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import { Nav } from "./nav";
import { File, Inbox, Send } from "lucide-react";
import { api } from "~/trpc/react";

type SidebarProps = {
    isCollapsed: boolean;
}

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
    const [accountId] = useLocalStorage("accountId", "");
    const [tab] = useLocalStorage<"inbox" | "drafts" | "sent">("freedom-tab", "inbox")
    const { data: numInboxThreads } = api.account.getNumThreads.useQuery({
        accountId,
        tab: "inbox"
    })
    const { data: numDraftThreads } = api.account.getNumThreads.useQuery({
        accountId,
        tab: "drafts"
    })
    const { data: numSentThreads } = api.account.getNumThreads.useQuery({
        accountId,
        tab: "sent"
    })

    return (
        <Nav links={[
            {
                title: "Inbox",
                label: numInboxThreads?.toString() ?? "0",
                icon: Inbox,
                variant: tab === "inbox" ? "default" : "ghost"
            },
            {
                title: "Drafts",
                label: numDraftThreads?.toString() ?? "0",
                icon: File,
                variant: tab === "drafts" ? "default" : "ghost"
            },
            {
                title: "Sent",
                label: numSentThreads?.toString() ?? "0",
                icon: Send,
                variant: tab === "sent" ? "default" : "ghost"
            },
        ]} 
        isCollapsed={isCollapsed} />
    );
};