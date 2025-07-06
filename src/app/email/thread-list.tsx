"use client";

import { format, formatDistanceToNow } from "date-fns";
import React, { type ComponentProps } from "react";
import useThreads from "~/hooks/use-threads";
import { cn } from "~/lib/utils";
import DOMPurify from "dompurify";
import { Badge } from "~/components/ui/badge";
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { motion } from "framer-motion"

export default function ThreadList() {
    const { threads, isFetching, threadId, setThreadId } = useThreads()
    const [parent] = useAutoAnimate(/* optional config */);

    const groupedThreads = React.useMemo(() => {
        return threads?.reduce((acc, thread) => {
            const date = format(thread.lastMessageDate ?? new Date(), "yyyy-MM-dd");
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(thread);
            return acc;
        }, {} as Record<string, typeof threads>);
    }, [threads])

    return (
        <div className="max-w-full overflow-y-auto max-h-[calc(100vh-120px)]">
            <div className="flex flex-col gap-2 p-4 pt-0">
                {Object.entries(groupedThreads ?? {}).map(([date, threads]) => {
                    return <React.Fragment key={date}>
                        <div className="text-xs font-medium text-muted-foreground mt-4 first:mt-0">
                            {format(new Date(date), "MMMM d, yyyy")}
                        </div>
                        {threads.map((item) => (
                            <button
                                id={`thread-${item.id}`}
                                key={item.id}
                                className={cn(
                                    "cursor-pointer flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all relative",
                                    threadId === item.id &&
                                    "bg-accent/50"
                                )}
                                onClick={() => {
                                    setThreadId(item.id);
                                }}
                            >
                                {threadId === item.id && (
                                    <motion.div
                                        className="absolute inset-0 dark:bg-white/20 bg-black/10 z-[-1] rounded-lg"
                                        layoutId="thread-list-item"
                                        transition={{
                                            duration: 0.1,
                                            ease: "easeInOut",
                                        }}
                                    />
                                )}
                                <div className="flex flex-col w-full gap-1">
                                    <div className="flex items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold">
                                                {item.emails.at(-1)?.from?.name}
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "ml-auto text-xs",
                                                threadId === item.id
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {formatDistanceToNow(item.emails.at(-1)?.sentAt ?? new Date(), {
                                                addSuffix: true,
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium">{item.subject}</div>
                                </div>
                                <div
                                    className="text-xs line-clamp-2 text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(item.emails.at(-1)?.bodySnippet ?? "", {
                                            USE_PROFILES: { html: true },
                                        }),
                                    }}
                                ></div>
                                {item.emails[0]?.sysLabels.length ? (
                                    <div className="flex items-center gap-2">
                                        {item.emails.at(0)?.sysLabels.map((label) => (
                                            <Badge
                                                key={label}
                                                variant={getBadgeVariantFromLabel(label)}
                                            >
                                                {label}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : null}
                            </button>
                        ))}
                    </React.Fragment>
                })}
            </div>
        </div>
    )
}

function getBadgeVariantFromLabel(
    label: string
): ComponentProps<typeof Badge>["variant"] {
    if (["work"].includes(label.toLowerCase())) {
        return "default";
    }

    if (["personal"].includes(label.toLowerCase())) {
        return "outline";
    }

    return "secondary";
}