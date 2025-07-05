import { NextResponse, type NextRequest } from "next/server";
import { Account } from "~/lib/account";
import { db } from "~/server/db";

export const POST = async (req: NextRequest) => {
    try {
        const { accountId, userId } = await req.json();
        if (!accountId || !userId) return NextResponse.json({ error: "Missing accountId or userId" }, { status: 400 });

        console.log(`Starting initial sync for accountId: ${accountId}, userId: ${userId}`);

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

        console.log(`Found account: ${dbAccount.emailAddress}`);

        const account = new Account(dbAccount.accessToken)
        const response = await account.performInitialSync()
        
        if (!response) {
            console.error("performInitialSync returned null/undefined");
            return NextResponse.json({ error: "Failed to perform initial sync" }, { status: 500 })
        }

        const {emails, deltaToken} = response;
        console.log(`Initial sync completed successfully. Emails synced: ${emails.length}, Delta token: ${deltaToken}`);

        // await db.account.update({
        //     where: {
        //         id: accountId,
        //     },
        //     data: {
        //         nextDeltaToken: deltaToken
        //     }
        // })

        // await syncEmailsDatabase(emails)

        return NextResponse.json({ 
            success: true, 
            emailCount: emails.length, 
            deltaToken: deltaToken 
        }, { status: 200 })
    } catch (error) {
        console.error("Error in initial sync endpoint:", error);
        
        if (error instanceof Error) {
            return NextResponse.json({ 
                error: "Initial sync failed", 
                details: error.message 
            }, { status: 500 });
        }
        
        return NextResponse.json({ 
            error: "Initial sync failed", 
            details: "Unknown error occurred" 
        }, { status: 500 });
    }
}