import { NextResponse, type NextRequest } from "next/server";
import { Account } from "~/lib/account";
import { syncEmailsToDatabase } from "~/lib/sync-to-db";
import { db } from "~/server/db";

export const maxDuration = 300

export const POST = async (req: NextRequest) => {
    await new Promise(resolve => setTimeout(resolve, 10000)); 
    
    const body = await req.json()
    const { accountId, userId } = body
    if (!accountId || !userId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId,
        }
    })
    if (!dbAccount) return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });

    const account = new Account(dbAccount.accessToken)
    await account.createSubscription()
    const response = await account.performInitialSync()
    if (!response) return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });

    const { deltaToken, emails } = response

    await syncEmailsToDatabase(emails, accountId)

    await db.account.update({
        where: {
            id: accountId,
            userId,
        },
        data: {
            nextDeltaToken: deltaToken,
        },
    });
    console.log('sync complete', deltaToken)
    return NextResponse.json({ success: true, deltaToken }, { status: 200 });

}