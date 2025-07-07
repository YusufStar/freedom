// /api/aurinko/callback

import { waitUntil } from "@vercel/functions";
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { exchangeAurinkoCodeForToken, getAccountDetails } from "~/lib/aurinko";
import { db } from "~/server/db";
import axios from "axios";

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
            userId: userId,
            accessToken: token.accessToken,
            emailAddress: accountDetails.email,
            name: accountDetails.name
        }
    })

    // trigger initial sync endpoint with delay to allow account initialization
    waitUntil(
        (async () => {
            try {
                // Wait a bit before triggering sync to allow account to initialize
                console.log('Waiting 5 seconds before triggering initial sync...');
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
                
                const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
                    accountId: token.accountId.toString(),
                    userId
                });
                
                console.log("Initial sync triggered successfully", response.data);
            } catch (error) {
                console.error("Failed to trigger initial sync", error);
                if (axios.isAxiosError(error)) {
                    console.error("Response data:", error.response?.data);
                }
            }
        })()
    )

    return NextResponse.redirect(new URL("/mail", req.url))
}