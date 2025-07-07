import { Prisma } from "@prisma/client";
import type { EmailMessage, EmailAddress, EmailAttachment } from "./types";
import { db } from "~/server/db";

// Helper function to safely parse dates
function safeParseDate(dateString?: string, fallback?: string): Date {
    if (!dateString) {
        return fallback ? safeParseDate(fallback) : new Date();
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return fallback ? safeParseDate(fallback) : new Date();
    }
    
    return date;
}

export async function syncEmailsToDatabase(emails: EmailMessage[], accountId: string) {
    try {
        for (const [index, email] of emails.entries()) {
            console.log('upserting email', index, email.threadId)
            await upsertEmail(email, index, accountId);
        }
    } catch (error) {
        console.error('oopies', error)
    }
}

async function upsertEmail(email: EmailMessage, index: number, accountId: string) {
    console.log('upserting email', index)
    try {
        let emailLabelType: 'inbox' | 'sent' | 'draft' = 'inbox'
        if (email.sysLabels.includes('inbox') || email.sysLabels.includes('important')) {
            emailLabelType = 'inbox'
        } else if (email.sysLabels.includes('sent')) {
            emailLabelType = 'sent'
        } else if (email.sysLabels.includes('draft')) {
            emailLabelType = 'draft'
        }

        // Parse dates safely
        const createdTime = safeParseDate(email.createdTime);
        const lastModifiedTime = safeParseDate(email.lastModifiedTime, email.createdTime);
        const sentAt = safeParseDate(email.sentAt, email.createdTime);
        const receivedAt = safeParseDate(email.receivedAt, email.createdTime);

        // 1. Upsert EmailAddress records
        const addressesToUpsert = new Map()
        const allAddresses = [
            email.from,
            ...(email.to || []),
            ...(email.cc || []),
            ...(email.bcc || []),
            ...(email.replyTo || [])
        ].filter(Boolean); // Remove any null/undefined values
        
        for (const address of allAddresses) {
            if (address && address.address) {
                addressesToUpsert.set(address.address, address);
            }
        }

        const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>> | null)[] = [];

        for (const address of addressesToUpsert.values()) {
            const upsertedAddress = await upsertEmailAddress(address, accountId);
            upsertedAddresses.push(upsertedAddress);
        }

        const addressMap = new Map(
            upsertedAddresses.filter(Boolean).map(address => [address!.address, address])
        );

        const fromAddress = addressMap.get(email.from.address);
        if (!fromAddress) {
            console.log(`Failed to upsert from address for email ${email.bodySnippet}`);
            return;
        }

        const toAddresses = (email.to || []).map(addr => addressMap.get(addr.address)).filter(Boolean);
        const ccAddresses = (email.cc || []).map(addr => addressMap.get(addr.address)).filter(Boolean);
        const bccAddresses = (email.bcc || []).map(addr => addressMap.get(addr.address)).filter(Boolean);
        const replyToAddresses = (email.replyTo || []).map(addr => addressMap.get(addr.address)).filter(Boolean);

        // 2. Upsert Thread
        const thread = await db.thread.upsert({
            where: { id: email.threadId },
            update: {
                subject: email.subject,
                accountId,
                lastMessageDate: sentAt,
                done: false,
                participantIds: [...new Set([
                    fromAddress.id,
                    ...toAddresses.map(a => a!.id),
                    ...ccAddresses.map(a => a!.id),
                    ...bccAddresses.map(a => a!.id)
                ])]
            },
            create: {
                id: email.threadId,
                accountId,
                subject: email.subject,
                done: false,
                draftStatus: emailLabelType === 'draft',
                inboxStatus: emailLabelType === 'inbox',
                sentStatus: emailLabelType === 'sent',
                lastMessageDate: sentAt,
                participantIds: [...new Set([
                    fromAddress.id,
                    ...toAddresses.map(a => a!.id),
                    ...ccAddresses.map(a => a!.id),
                    ...bccAddresses.map(a => a!.id)
                ])]
            }
        });

        // 3. Upsert Email
        await db.email.upsert({
            where: { id: email.id },
            update: {
                threadId: thread.id,
                createdTime: createdTime,
                lastModifiedTime: lastModifiedTime,
                sentAt: sentAt,
                receivedAt: receivedAt,
                internetMessageId: email.internetMessageId,
                subject: email.subject,
                sysLabels: email.sysLabels || [],
                keywords: email.keywords || [],
                sysClassifications: email.sysClassifications || [],
                sensitivity: email.sensitivity,
                meetingMessageMethod: email.meetingMessageMethod,
                fromId: fromAddress.id,
                to: { set: toAddresses.map(a => ({ id: a!.id })) },
                cc: { set: ccAddresses.map(a => ({ id: a!.id })) },
                bcc: { set: bccAddresses.map(a => ({ id: a!.id })) },
                replyTo: { set: replyToAddresses.map(a => ({ id: a!.id })) },
                hasAttachments: email.hasAttachments,
                internetHeaders: (email.internetHeaders || []) as any,
                body: email.body,
                bodySnippet: email.bodySnippet,
                inReplyTo: email.inReplyTo,
                references: email.references,
                threadIndex: email.threadIndex,
                nativeProperties: email.nativeProperties as any,
                folderId: email.folderId,
                omitted: email.omitted || [],
                emailLabel: emailLabelType,
            },
            create: {
                id: email.id,
                emailLabel: emailLabelType,
                threadId: thread.id,
                createdTime: createdTime,
                lastModifiedTime: lastModifiedTime,
                sentAt: sentAt,
                receivedAt: receivedAt,
                internetMessageId: email.internetMessageId,
                subject: email.subject,
                sysLabels: email.sysLabels || [],
                internetHeaders: (email.internetHeaders || []) as any,
                keywords: email.keywords || [],
                sysClassifications: email.sysClassifications || [],
                sensitivity: email.sensitivity,
                meetingMessageMethod: email.meetingMessageMethod,
                fromId: fromAddress.id,
                to: { connect: toAddresses.map(a => ({ id: a!.id })) },
                cc: { connect: ccAddresses.map(a => ({ id: a!.id })) },
                bcc: { connect: bccAddresses.map(a => ({ id: a!.id })) },
                replyTo: { connect: replyToAddresses.map(a => ({ id: a!.id })) },
                hasAttachments: email.hasAttachments,
                body: email.body,
                bodySnippet: email.bodySnippet,
                inReplyTo: email.inReplyTo,
                references: email.references,
                threadIndex: email.threadIndex,
                nativeProperties: email.nativeProperties as any,
                folderId: email.folderId,
                omitted: email.omitted || [],
            }
        });


        const threadEmails = await db.email.findMany({
            where: { threadId: thread.id },
            orderBy: { receivedAt: 'asc' }
        });

        let threadFolderType = 'sent';
        for (const threadEmail of threadEmails) {
            if (threadEmail.emailLabel === 'inbox') {
                threadFolderType = 'inbox';
                break; // If any email is in inbox, the whole thread is in inbox
            } else if (threadEmail.emailLabel === 'draft') {
                threadFolderType = 'draft'; // Set to draft, but continue checking for inbox
            }
        }
        await db.thread.update({
            where: { id: thread.id },
            data: {
                draftStatus: threadFolderType === 'draft',
                inboxStatus: threadFolderType === 'inbox',
                sentStatus: threadFolderType === 'sent',
            }
        });

        // 4. Upsert Attachments
        if (email.attachments && Array.isArray(email.attachments)) {
            for (const attachment of email.attachments) {
                await upsertAttachment(email.id, attachment);
            }
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`Prisma error for email ${email.id}: ${error.message}`);
        } else {
            console.error(`Unknown error for email ${email.id}: ${error}`);
        }
    }
}

async function upsertAttachment(emailId: string, attachment: EmailAttachment) {
    try {
        await db.emailAttachment.upsert({
            where: { id: attachment.id ?? "" },
            update: {
                name: attachment.name,
                mimeType: attachment.mimeType,
                size: attachment.size,
                inline: attachment.inline,
                contentId: attachment.contentId,
                content: attachment.content,
                contentLocation: attachment.contentLocation,
            },
            create: {
                id: attachment.id,
                emailId,
                name: attachment.name,
                mimeType: attachment.mimeType,
                size: attachment.size,
                inline: attachment.inline,
                contentId: attachment.contentId,
                content: attachment.content,
                contentLocation: attachment.contentLocation,
            },
        });
    } catch (error) {
        console.error(`Failed to upsert attachment for email ${emailId}: ${error}`);
    }
}

async function upsertEmailAddress(address: EmailAddress, accountId: string) {
    try {
        const existingAddress = await db.emailAddress.findUnique({
            where: {
                accountId_address: {
                    accountId,
                    address: address.address
                }
            }
        })

        if (existingAddress) {
            return await db.emailAddress.update({
                where: { id: existingAddress.id },
                data: {
                    name: address.name,
                    raw: address.raw
                }
            })
        } else {
            return await db.emailAddress.create({
                data: {
                    address: address.address,
                    name: address.name,
                    raw: address.raw,
                    accountId
                }
            })
        }
    } catch (error) {
        console.error('Failed to upsert email address', error)
        return null
    }
}