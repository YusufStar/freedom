// api/aurinko/webhook

import { NextRequest } from "next/server";
import crypto from "crypto";
import { Account } from "~/lib/account";
import { db } from "~/server/db";
import { waitUntil } from "@vercel/functions";

const AURINKO_SIGNING_SECRET = process.env.AURINKO_SIGNING_SECRET;

export const POST = async (req: NextRequest) => {
    console.log("POST request received");
    const query = req.nextUrl.searchParams;
    const validationToken = query.get("validationToken");
    if (validationToken) {
        console.log("Validation token received, returning token:", validationToken);
        return new Response(validationToken, { status: 200 });
    }

    console.log("Processing webhook notification...");
    const timestamp = req.headers.get("X-Aurinko-Request-Timestamp");
    const signature = req.headers.get("X-Aurinko-Signature");
    const body = await req.text();

    if (!timestamp || !signature || !body) {
        console.error("Missing required headers or body", { timestamp: !!timestamp, signature: !!signature, body: !!body });
        return new Response("Bad Request", { status: 400 });
    }

    const basestring = `v0:${timestamp}:${body}`;
    const expectedSignature = crypto
        .createHmac("sha256", AURINKO_SIGNING_SECRET!)
        .update(basestring)
        .digest("hex");

    if (signature !== expectedSignature) {
        console.error("Signature verification failed", { received: signature, expected: expectedSignature });
        return new Response("Unauthorized", { status: 401 });
    }

    console.log("Signature verified successfully");
    
    type AurinkoNotification = {
        subscription: number;
        resource: string;
        accountId: number;
        payloads: {
            id: string;
            changeType: string;
            attributes: {
                threadId: string;
            };
        }[];
    };

    const payload = JSON.parse(body) as AurinkoNotification;
    console.log("Received notification:", JSON.stringify(payload, null, 2));
    
    const account = await db.account.findUnique({
        where: {
            id: payload.accountId.toString()
        }
    })
    
    if (!account) {
        console.error("Account not found for accountId:", payload.accountId);
        return new Response("Account not found", { status: 404 });
    }
    
    console.log("Account found, starting email sync for:", account.emailAddress);
    const acc = new Account(account.accessToken)
    
    waitUntil(acc.syncEmails().then(() => {
        console.log("Successfully synced emails for account:", account.emailAddress)
    }).catch((error) => {
        console.error("Failed to sync emails:", error)
    }))

    console.log("Webhook processed successfully");
    return new Response(null, { status: 200 });
};