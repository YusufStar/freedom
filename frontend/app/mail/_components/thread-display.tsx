"use client"

import { useLocalStorage } from "usehooks-ts"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/axios"
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { addDays, addHours, format, nextSaturday } from "date-fns"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import DOMPurify from "dompurify"
import { Skeleton } from "@/components/ui/skeleton"

interface EmailDetail {
  id: string
  from: string | { name?: string; address?: string }
  subject: string
  date: string
  contentHtml?: string
  contentText?: string
}

interface ThreadDisplayProps {
  selectedId: string | null
}

export function ThreadDisplay({ selectedId }: ThreadDisplayProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [accountId] = useLocalStorage<string | null>("accountId", null)

  const {
    data: email,
    isFetching,
  } = useQuery<EmailDetail | null>({
    queryKey: ["email", selectedId],
    enabled: !!selectedId && !!accountId,
    queryFn: () => apiRequest.get<EmailDetail>(`/emails/${selectedId}`),
  })

  const renderSkeleton = () => (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex gap-3 items-center">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );

  if (!mounted) return renderSkeleton();

  if (!selectedId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No message selected
      </div>
    )
  }

  if (isFetching || !email) {
    return renderSkeleton();
  }

  const senderName =
    typeof email.from === "string"
      ? email.from
      : email.from?.name || email.from?.address || "Unknown"

  const initials = senderName
    .split(" ")
    .map((s) => s[0])
    .join("")

  const today = new Date()

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          {[Archive, ArchiveX, Trash2].map((Icon, idx) => (
            <Button key={idx} variant="ghost" size="icon">
              <Icon className="w-4 h-4" />
            </Button>
          ))}
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Clock className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-[535px] p-0">
              <div className="flex flex-col gap-2 px-2 py-4 border-r">
                <div className="px-4 text-sm font-medium">Snooze until</div>
                <div className="grid min-w-[250px] gap-1">
                  <Button variant="ghost" className="justify-start font-normal">
                    Later today
                    <span className="ml-auto text-muted-foreground">
                      {format(addHours(today, 4), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Tomorrow
                    <span className="ml-auto text-muted-foreground">
                      {format(addDays(today, 1), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    This weekend
                    <span className="ml-auto text-muted-foreground">
                      {format(nextSaturday(today), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Next week
                    <span className="ml-auto text-muted-foreground">
                      {format(addDays(today, 7), "E, h:m b")}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <Calendar />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {[Reply, ReplyAll, Forward].map((Icon, idx) => (
            <Button key={idx} variant="ghost" size="icon">
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
      <Separator />

      {/* Email content */}
      <div className="flex flex-col flex-1 overflow-auto">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Avatar>
              <AvatarImage alt={senderName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <div className="font-semibold">{senderName}</div>
              <div className="text-xs line-clamp-1">{email.subject}</div>
              {typeof email.from !== "string" && (
                <div className="text-xs line-clamp-1">
                  <span className="font-medium">Reply-To:</span> {email.from.address}
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {format(new Date(email.date), "PPpp")}
          </div>
        </div>
        <Separator />
        <div className="p-6 prose max-w-none">
          {/* Render HTML content safely */}
          {email.contentHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.contentHtml) }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
              {email.contentText}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
} 