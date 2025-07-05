// /api/aurinko/callback

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { exchangeAurinkoCodeForToken, getAccountDetails } from "~/lib/aurinko";
import { db } from "~/server/db";

export const GET = async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = req.nextUrl.searchParams;
    const status = params.get("status");
    if (status !== "success") return NextResponse.json({ error: "Failed to link account" }, { status: 400 });

    const code = params.get("code");
    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });
    const token = await exchangeAurinkoCodeForToken(code)
    if (!token) return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 400 });

    const accountDetails = await getAccountDetails(token.accessToken)

    await db.account.upsert({
        where: {
            id: token.accountId.toString()
        },
        update: {
            accessToken: token.accessToken,
        },
        create: {
            id: token.accountId.toString(),
            userID: userId,
            accessToken: token.accessToken,
            emailAddress: accountDetails.email,
            name: accountDetails.name
        }
    })

    return NextResponse.redirect(new URL("/email", req.url))
}