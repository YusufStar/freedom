"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import type { EmailMessage } from "./types";

export const getAurinkoAuthUrl = async (serviceType: "Google" | "Office365" | "iCloud" | "IMAP") => {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized");

    // IMAP için farklı scope'lar kullan
    const scopes = serviceType === "IMAP"
        ? "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts"
        : "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All";

    const params = new URLSearchParams({
        clientId: process.env.AURINKO_CLIENT_ID!,
        serviceType,
        scopes,
        responseType: "code",
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`
    })

    return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`
}

export const exchangeAurinkoCodeForToken = async (code: string) => {
    try {
        const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`, {}, {
            auth: {
                username: process.env.AURINKO_CLIENT_ID!,
                password: process.env.AURINKO_CLIENT_SECRET!
            }
        })

        return response.data as {
            accountId: number;
            accessToken: string;
            userId: string;
            userSession: string;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Aurinko API Error:", error.response?.data)
        }

        console.error("Aurinko API Error:", error)
    }
}

export const getAccountDetails = async (accessToken: string) => {
    try {
        const response = await axios.get(`https://api.aurinko.io/v1/account`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        return {
            email: response.data.email,
            name: response.data.name || response.data.email || "Unknown"
        } as {
            email: string;
            name: string;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Aurinko API Error:", error.response?.data)
        } else {
            console.error("Aurinko API Error:", error)
        }

        throw error
    }
}

export const getEmailDetails = async (accessToken: string, emailId: string) => {
    try {
        const response = await axios.get<EmailMessage>(`https://api.aurinko.io/v1/email/messages/${emailId}`, {
            params: {
                loadInlines: true
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching email details:', error.response?.data);
        } else {
            console.error('Unexpected error fetching email details:', error);
        }
        throw error;
    }
}

