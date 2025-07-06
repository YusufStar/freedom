import { db } from "~/server/db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.account.findUnique({
        where: {
            id: accountId,
            userId
        },
        select: {
            id: true,
            emailAddress: true,
            name: true,
            accessToken: true,
        }
    })
    if (!account) {
        throw new Error("Account not found")
    }
    return account;
}

export const accountRouter = createTRPCRouter({
    getAccounts: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.account.findMany({
            where: {
                userId: ctx.auth.userId,
            }, select: {
                id: true, emailAddress: true, name: true
            }
        })
    }),
    getNumThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.enum(["inbox", "drafts", "sent"]),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        let filter: Prisma.ThreadWhereInput = {
            accountId: account.id,
        }

        if (input.tab === "inbox") {
            filter.inboxStatus = true
        } else if (input.tab === "drafts") {
            filter.draftStatus = true
        } else if (input.tab === "sent") {
            filter.sentStatus = true
        }

        return await ctx.db.thread.count({
            where: filter
        })
    }),
    getThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.enum(["inbox", "drafts", "sent"]),
        done: z.boolean()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        let filters: Prisma.ThreadWhereInput = {
            accountId: account.id,
        }

        if (input.tab === "inbox") {
            filters.inboxStatus = true
        } else if (input.tab === "drafts") {
            filters.draftStatus = true
        } else if (input.tab === "sent") {
            filters.sentStatus = true
        }
        
        filters.done = {
            equals: input.done
        }

        return await ctx.db.thread.findMany({
            where: filters,
            include: {
                emails: {
                    orderBy: {
                        sentAt: "asc"
                    },
                    select: {
                        from: true,
                        body: true,
                        bodySnippet: true,
                        emailLabel: true,
                        subject: true,
                        sysLabels: true,
                        id: true,
                        sentAt: true,
                    }
                }
            },
            take: 15,
            orderBy: {
                lastMessageDate: "desc"
            }
        })
    })
})