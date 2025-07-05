import axios from "axios";
import type { EmailMessage, SyncResponse, SyncUpdatedResponse } from "./types";

export class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync() {
        const response = await axios.post<SyncResponse>(`https://api.aurinko.io/v1/email/sync`, {}, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
            params: {
                daysWithin: 2,
                bodyType: 'html'
            }
        })

        return response.data;
    }

    async getUpdatedEmails({ deltaToken, pageToken }: { deltaToken?: string, pageToken?: string }) {
        let params: Record<string, string> = {}
        if (deltaToken) params.deltaToken = deltaToken
        if (pageToken) params.pageToken = pageToken

        const response = await axios.get<SyncUpdatedResponse>("https://api.aurinko.io/v1/email/sync/updated", {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
            params
        })

        return response.data;
    }

    private async waitForAccountInitialization(maxRetries = 10, baseDelay = 2000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const syncResponse = await this.startSync();
                return syncResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const errorMessage = error.response?.data?.message || error.response?.data?.code || '';
                    
                    // If account is not initialized yet, wait and retry
                    if (errorMessage.includes('Account is not initialized yet') || errorMessage.includes('unavailable')) {
                        if (attempt < maxRetries) {
                            const delay = baseDelay * Math.pow(1.5, attempt - 1); // Exponential backoff
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    }
                }
                throw error;
            }
        }
        throw new Error(`Account failed to initialize after ${maxRetries} attempts`);
    }

    async performInitialSync() {
        try {
            // Wait for account to be initialized with retry mechanism
            let syncResponse = await this.waitForAccountInitialization();
            
            // Wait for sync to be ready
            while (!syncResponse.ready) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                syncResponse = await this.startSync()
            }

            let storedDeltaToken: string = syncResponse.syncUpdatedToken;

            let updatedResponse = await this.getUpdatedEmails({
                deltaToken: storedDeltaToken
            })

            if (updatedResponse.nextDeltaToken) {
                storedDeltaToken = updatedResponse.nextDeltaToken;
            }

            let allEmails: EmailMessage[] = updatedResponse.records;

            while (updatedResponse.nextPageToken) {
                updatedResponse = await this.getUpdatedEmails({pageToken: updatedResponse.nextPageToken});
                allEmails = allEmails.concat(updatedResponse.records);
                if (updatedResponse.nextDeltaToken) {
                    storedDeltaToken = updatedResponse.nextDeltaToken
                }
            }

            return {
                emails: allEmails,
                deltaToken: storedDeltaToken
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error during sync:', JSON.stringify(error.response?.data, null, 2))
            } else {
                console.error("Failed to perform initial sync", error)
            }

            throw error; // Re-throw the error instead of swallowing it
        }
    }
}