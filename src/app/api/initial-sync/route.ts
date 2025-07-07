import { NextResponse, type NextRequest } from "next/server";
import { Account } from "~/lib/account";
import { syncEmailsToDatabase } from "~/lib/sync-to-db";
import { db } from "~/server/db";

export const POST = async (req: NextRequest) => {
    await new Promise(resolve => setTimeout(resolve, 10000)); 

    const { accountId, userId } = await req.json();
    console.log('initial sync', accountId, userId)
    if (!accountId || !userId) return NextResponse.json({ error: "Missing accountId or userId" }, { status: 400 });

    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId
        }
    })

    if (!dbAccount) {
        console.error(`Account not found for accountId: ${accountId}, userId: ${userId}`);
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const account = new Account(dbAccount.accessToken)
    
    // Try to create subscription, but don't fail if it doesn't work
    try {
        await account.createSubscription()
        console.log('Subscription created successfully')
    } catch (error) {
        console.error('Failed to create subscription, but continuing with sync:', error)
        // Continue with sync even if subscription creation fails
    }
    
    const response = await account.performInitialSync()
    if (!response) return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });

    const { emails, deltaToken } = response;

    await syncEmailsToDatabase(emails, accountId)

    await db.account.update({
        where: {
            id: accountId,
            userId
        },
        data: {
            nextDeltaToken: deltaToken
        }
    })

    console.log('sync complete', deltaToken)

    return NextResponse.json({
        success: true,
        deltaToken
    }, { status: 200 })
}