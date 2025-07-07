import { NextResponse, type NextRequest } from "next/server";
import { Account } from "~/lib/account";
import { syncEmailsToDatabase } from "~/lib/sync-to-db";
import { db } from "~/server/db";

export const POST = async (req: NextRequest) => {
    const { accountId, userId } = await req.json();
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
    await account.createSubscription()
    const response = await account.performInitialSync()
    if (!response) return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });

    const { emails, deltaToken } = response;

    await syncEmailsToDatabase(emails, accountId)

    await db.account.update({
        where: {
            accessToken: dbAccount.accessToken
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