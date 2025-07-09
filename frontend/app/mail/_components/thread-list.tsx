"use client"

import React, { useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/axios";
import { format, formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { m } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailAddress {
  name?: string;
  address?: string;
}

interface Email {
  id: string;
  from: string | EmailAddress;
  subject: string;
  date: string; // ISO string
  contentText?: string;
}

interface ThreadListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ThreadList({ selectedId, onSelect }: ThreadListProps) {
  const [accountId] = useLocalStorage<string | null>("accountId", null);

  const { register, watch } = useForm<{ search: string }>({ defaultValues: { search: "" } });
  const search = watch("search");

  const {
    data: emails,
    isLoading,
  } = useQuery<Email[]>({
    queryKey: ["emails", accountId],
    enabled: !!accountId,
    queryFn: () => apiRequest.get<Email[]>(`/emails?accountId=${accountId}&limit=100&offset=0`),
    refetchInterval: 2000, // 2 seconds
  });

  // convert to thread-like grouping by subject (simplified)
  const threads = useMemo(() => {
    if (!emails) return [] as { id: string; subject: string; lastMessageDate: Date; snippet: string; sender: string; }[];
    const map = new Map<string, { id: string; subject: string; lastMessageDate: Date; snippet: string; sender: string; }>();
    emails.forEach((email) => {
      const subject = email.subject || "(no subject)";
      const existing = map.get(subject);
      const dateObj = new Date(email.date);
      const sender = typeof email.from === "string" ? email.from : email.from.name || email.from.address || "";
      const snippet = email.contentText?.slice(0, 120) || "";
      if (!existing || dateObj > existing.lastMessageDate) {
        map.set(subject, { id: email.id, subject, lastMessageDate: dateObj, snippet, sender });
      }
    });
    let arr = Array.from(map.values());
    if (search) {
      const term = search.toLowerCase();
      arr = arr.filter((t) => t.subject.toLowerCase().includes(term) || t.sender.toLowerCase().includes(term));
    }
    return arr;
  }, [emails, search]);

  // group by date
  const groupedThreads = useMemo(() => {
    return threads.reduce<Record<string, typeof threads>>( (acc, thread) => {
      const date = format(thread.lastMessageDate, "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date].push(thread);
      return acc;
    }, {} as Record<string, typeof threads>);
  }, [threads]);

  const [parent] = useAutoAnimate<HTMLDivElement>();

  // Avoid hydration mismatches by waiting until the component has mounted on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderSkeleton = () => (
    <ScrollArea className="max-w-full max-h-[calc(100vh-120px)]">
      <div className="p-4 pt-0 flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border rounded-lg p-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  // Before hydration completes
  if (!mounted) return renderSkeleton();

  if (!accountId) return <div className="p-4 text-muted-foreground">Select an account.</div>;

  return (
    <ScrollArea className="max-w-full max-h-[calc(100vh-120px)]">
      <div className="p-4 pt-0 flex flex-col gap-2" ref={parent}>
        {/* search */}
        <div className="sticky top-0 bg-background pb-3 pt-4 z-10">
          <Input placeholder="Search…" {...register("search")}/>
        </div>
        {(!emails || isLoading) && renderSkeleton()}
        {emails && Object.entries(groupedThreads)
          .sort((a, b) => (a[0] > b[0] ? -1 : 1))
          .map(([date, list]) => (
            <React.Fragment key={date}>
              <div className="text-xs font-medium text-muted-foreground mt-4 first:mt-0">
                {format(new Date(date), "MMMM d, yyyy")}
              </div>
              {list.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all relative",
                    selectedId === item.id && "bg-accent/20"
                  )}
                  onClick={() => onSelect(item.id)}
                >
                  {selectedId === item.id && (
                    <m.div
                      className="absolute inset-0 dark:bg-white/20 bg-black/10 z-[-1] rounded-lg"
                      layoutId="thread-highlight"
                      transition={{ duration: 0.1, ease: "easeInOut" }}
                    />
                  )}
                  <div className="flex items-center w-full">
                    <div className="font-semibold truncate max-w-[70%]">
                      {item.sender}
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(item.lastMessageDate, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs font-medium truncate w-full">
                    {item.subject}
                  </div>
                  {item.snippet && (
                    <div
                      className="text-xs text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.snippet) }}
                    />
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
      </div>
    </ScrollArea>
  );
} 