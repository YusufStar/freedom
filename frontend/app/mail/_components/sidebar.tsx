"use client"

import { useEffect, useState } from "react"
import { Nav } from "./nav"
import {
  Inbox,
  File,
  Send,
} from "lucide-react"

import { useLocalStorage } from "usehooks-ts"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

type Props = { isCollapsed: boolean }

export default function SideBar({ isCollapsed }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [tab] = useLocalStorage("yusufstar-tab", "inbox")
  const [accountId] = useLocalStorage("accountId", "")

  // Re-fetch counts every 2 seconds
  const refetchInterval = 2000

  const getCount = (folder: string) =>
    api.mail.getThreadCount({ accountId, folder })

  const { data: inboxCount } = useQuery<number>({
    queryKey: ["threads-count", accountId, "inbox"],
    queryFn: () => getCount("inbox").then((res) => res.count),
    enabled: !!accountId,
    refetchInterval,
    initialData: 0,
  })

  const { data: draftsCount } = useQuery<number>({
    queryKey: ["threads-count", accountId, "drafts"],
    queryFn: () => getCount("drafts").then((res) => res.count),
    enabled: !!accountId,
    refetchInterval,
    initialData: 0,
  })

  const { data: sentCount } = useQuery<number>({
    queryKey: ["threads-count", accountId, "sent"],
    queryFn: () => getCount("sent").then((res) => res.count),
    enabled: !!accountId,
    refetchInterval,
    initialData: 0,
  })

  if (!mounted) {
    return <div className="p-2" />
  }

  return (
    <Nav
      isCollapsed={isCollapsed}
      links={[
        {
          title: "Inbox",
          label: inboxCount?.toString() || "0",
          icon: Inbox,
          variant: tab === "inbox" ? "default" : "ghost",
        },
        {
          title: "Drafts",
          label: draftsCount?.toString() || "0",
          icon: File,
          variant: tab === "drafts" ? "default" : "ghost",
        },
        {
          title: "Sent",
          label: sentCount?.toString() || "0",
          icon: Send,
          variant: tab === "sent" ? "default" : "ghost",
        },
      ]}
    />
  )
} 