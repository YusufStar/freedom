"use client"

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "usehooks-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/axios";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ApiError } from "@/lib/axios";
import { z } from "zod";

interface MailAccount {
    id: string;
    email: string;
    [key: string]: unknown; // allow additional fields
}

interface AccountSwitcherProps {
    isCollapsed: boolean;
}

export function AccountSwitcher({ isCollapsed }: AccountSwitcherProps) {
    const queryClient = useQueryClient();

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

    // Alert dialog open state managed by Radix via Trigger; internal tab state
    const [tab, setTab] = React.useState<string>("connect");
    const [isOpen, setIsOpen] = React.useState(false);

    // form states
    const [connectLocalPart, setConnectLocalPart] = React.useState("");
    const [connectPassword, setConnectPassword] = React.useState("");
    const [connectError, setConnectError] = React.useState<string | null>(null);
    const [createLocalPart, setCreateLocalPart] = React.useState("");
    const [createPassword, setCreatePassword] = React.useState("");
    const [createError, setCreateError] = React.useState<string | null>(null);

    const connectMutation = useMutation({
        mutationFn: () => {
            const email = `${connectLocalPart}@yusufstar.com`;
            return apiRequest.post("/mailbox/connect", { email, password: connectPassword });
        },
        onSuccess: () => {
            toast.success("Mailbox connected successfully");
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            setIsOpen(false);
        },
        onError: (err: unknown) => {
            const message = err instanceof ApiError ? err.message : "Connection failed";
            toast.error(message);
        }
    });

    const createMutation = useMutation({
        mutationFn: () => apiRequest.post("/mailbox/create", { localPart: createLocalPart, password: createPassword, name: createLocalPart }),
        onSuccess: () => {
            toast.success("Mailbox created successfully");
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            setIsOpen(false);
        },
        onError: (err: unknown) => {
            const message = err instanceof ApiError ? err.message : "Creation failed";
            toast.error(message);
        }
    });

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
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <div
                                className="relative flex hover:bg-accent w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                            >
                                <Plus className="size-4 mr-1" /> Add account
                            </div>
                        </DialogTrigger>

                        <DialogContent onPointerDownOutside={(e)=>e.preventDefault()}>
                            <Tabs value={tab} onValueChange={setTab} className="w-full" defaultValue="connect">
                                <TabsList className="mb-4 flex justify-center w-full">
                                    <TabsTrigger value="connect">Connect</TabsTrigger>
                                    <TabsTrigger value="create">Create</TabsTrigger>
                                </TabsList>

                                <TabsContent value="connect">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            // validation
                                            const schema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/);
                                            const result = schema.safeParse(connectLocalPart);
                                            if (!result.success) {
                                                setConnectError("Only letters, numbers, dots, underscores and hyphens allowed and 3-50 chars");
                                                return;
                                            }
                                            setConnectError(null);
                                            connectMutation.mutate();
                                        }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm mb-1" htmlFor="connect-local">Username</label>
                                            <div className="flex gap-2 items-center">
                                                <Input id="connect-local" type="text" value={connectLocalPart} onChange={(e) => setConnectLocalPart(e.target.value)} required />
                                                <span className="text-sm">@yusufstar.com</span>
                                            </div>
                                            {connectError && <p className="text-xs text-destructive mt-1">{connectError}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1" htmlFor="connect-pass">Password</label>
                                            <Input id="connect-pass" type="password" value={connectPassword} onChange={(e) => setConnectPassword(e.target.value)} required />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                            <Button type="submit" disabled={connectMutation.isPending}>{connectMutation.isPending ? "Connecting…" : "Connect"}</Button>
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="create">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const schema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/);
                                            const result = schema.safeParse(createLocalPart);
                                            if (!result.success) {
                                                setCreateError("Only letters, numbers, dots, underscores and hyphens allowed and 3-50 chars");
                                                return;
                                            }
                                            setCreateError(null);
                                            createMutation.mutate();
                                        }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm mb-1" htmlFor="create-email">Username</label>
                                            <div className="flex gap-2 items-center">
                                                <Input id="create-email" placeholder="john.doe" type="text" value={createLocalPart} onChange={(e) => setCreateLocalPart(e.target.value)} required />
                                                <span className="text-sm">@yusufstar.com</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1" htmlFor="create-pass">Password</label>
                                            <Input id="create-pass" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required />
                                        </div>
                                        {createError && <p className="text-xs text-destructive">{createError}</p>}
                                        <div className="flex justify-end gap-2">
                                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create"}</Button>
                                        </div>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </SelectContent>
            </Select>
        </div>
    );
} 