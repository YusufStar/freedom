"use client"

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/axios";

interface MailAccount {
    id: string;
    email: string;
    [key: string]: unknown; // allow additional fields
}

interface AccountSwitcherProps {
    isCollapsed: boolean;
}

export function AccountSwitcher({ isCollapsed }: AccountSwitcherProps) {
    const router = useRouter();

    // Local storage to persist selected account
    const [accountId, setAccountId] = useLocalStorage<string | null>("accountId", null);

    // Fetch accounts list
    const {
        data: accounts,
        isLoading,
        error,
    } = useQuery<MailAccount[]>({
        queryKey: ["accounts"],
        queryFn: async () => apiRequest.get<MailAccount[]>("/accounts"),
        staleTime: 1000 * 60, // 1 minute
    });

    // When accounts list is fetched, ensure a valid accountId is selected
    React.useEffect(() => {
        if (!accounts || accounts.length === 0) return;
        if (accountId && accounts.some((a) => a.id === accountId)) return;
        // default to first account if none selected
        setAccountId(accounts[0]!.id);
    }, [accounts, accountId, setAccountId]);

    // handle select change
    const handleChange = (value: string) => {
        setAccountId(value);
    };

    const handleAddAccount = () => {
        router.push("/mail/connect");
    };

    if (isLoading) return <div className="text-sm text-muted-foreground">Loading accounts...</div>;
    if (error) {
        console.error(error);
        return <div className="text-sm text-destructive">Failed to load accounts</div>;
    }

    if (!accounts) return null;

    return (
        <div className="items-center gap-2 flex w-full">
            <Select value={accountId ?? undefined} onValueChange={handleChange} defaultValue={accountId ?? undefined}>
                <SelectTrigger
                    className={cn(
                        "flex w-full flex-1 items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
                        isCollapsed &&
                        "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
                    )}
                    aria-label="Select account"
                >
                    <SelectValue placeholder="Select an account">
                        <span className={cn({ hidden: !isCollapsed })}>{
                            accounts.find((a) => a.id === accountId)?.email[0]
                        }</span>
                        <span className={cn("ml-2", isCollapsed && "hidden")}>{
                            accounts.find((a) => a.id === accountId)?.email
                        }</span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                                {account.email}
                            </div>
                        </SelectItem>
                    ))}
                    <div
                        onClick={handleAddAccount}
                        className="relative flex hover:bg-accent w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Plus className="size-4 mr-1" /> Add account
                    </div>
                </SelectContent>
            </Select>
        </div>
    );
} 