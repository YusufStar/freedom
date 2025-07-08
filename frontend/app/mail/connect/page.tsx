"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/axios";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface MailAccount {
  id: string;
  email: string;
}

export default function MailConnectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery<MailAccount[]>({
    queryKey: ["accounts"],
    queryFn: () => apiRequest.get<MailAccount[]>("/accounts"),
  });

  // determine default tab based on whether user already has @yusufstar.com account
  const [tab, setTab] = useState<string>("connect");
  useEffect(() => {
    if (!accounts) return;
    const hasYusuf = accounts.some((a) => a.email.endsWith("@yusufstar.com"));
    setTab(hasYusuf ? "connect" : "create");
  }, [accounts]);

  // form states
  const [connectEmail, setConnectEmail] = useState<string>("");
  const [connectPassword, setConnectPassword] = useState<string>("");
  const [createEmail, setCreateEmail] = useState<string>("");
  const [createPassword, setCreatePassword] = useState<string>("");

  const connectMutation = useMutation({
    mutationFn: () =>
      apiRequest.post("/mailbox/connect", {
        email: connectEmail,
        password: connectPassword,
      }),
    onSuccess: () => {
      toast.success("Mailbox connected successfully");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push("/mail");
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : "Connection failed";
      toast.error(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      // extract localPart for API (before @) if user entered full email
      const localPart = createEmail.includes("@") ? createEmail.split("@")[0] : createEmail;
      return apiRequest.post("/mailbox/create", {
        localPart,
        password: createPassword,
        name: localPart, // backend requires name; using localPart as placeholder
      });
    },
    onSuccess: () => {
      toast.success("Mailbox created successfully");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push("/mail");
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : "Creation failed";
      toast.error(message);
    },
  });

  return (
    <div className="max-w-md mx-auto py-10 px-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Link your mailbox</h1>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="connect">Connect</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>

        {/* CONNECT TAB */}
        <TabsContent value="connect">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connectMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm mb-1" htmlFor="connect-email">
                Email (@yusufstar.com)
              </label>
              <Input
                id="connect-email"
                type="email"
                value={connectEmail}
                onChange={(e) => setConnectEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="connect-password">
                Password
              </label>
              <Input
                id="connect-password"
                type="password"
                value={connectPassword}
                onChange={(e) => setConnectPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={connectMutation.isPending} className="w-full">
              {connectMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </TabsContent>

        {/* CREATE TAB */}
        <TabsContent value="create">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm mb-1" htmlFor="create-email">
                Desired email (without @yusufstar.com)
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  id="create-email"
                  type="text"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="john.doe"
                  required
                />
                <span className="text-sm">@yusufstar.com</span>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="create-password">
                Password
              </label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Creating..." : "Create Mailbox"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
} 