"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface Props {
  isCollapsed: boolean;
}

export function UserInfo({ isCollapsed }: Props) {
  const { user } = useCurrentUser();

  if (!user) return null;

  const initials = user.email?.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-t border-border",
        isCollapsed && "justify-center"
      )}
    >
      <Avatar>
        {/* If you later store avatar URL on user, update here */}
        <AvatarImage src={undefined} alt={user.email} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">{user.email}</span>
      )}
    </div>
  );
} 