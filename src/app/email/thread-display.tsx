import { Archive, ArchiveX, Clock, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Separator } from "~/components/ui/separator"
import useThreads from "~/hooks/use-threads"

const ThreadDisplay = () => {
    const { threadId, threads } = useThreads()
    const thread = threads?.find(thread => thread.id === threadId)

    return <div className="flex flex-col h-full">
        {/* buttons row */}
        <div className="flex items-center p-2">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" disabled={!threadId}>
                    <Archive className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={!threadId}>
                    <ArchiveX className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={!threadId}>
                    <Trash2 className="size-4" />
                </Button>
            </div>
            <Separator orientation="vertical" className="ml-2" />
            <Button className="ml-2" variant="ghost" size="icon" disabled={!threadId}>
                <Clock className="size-4" />
            </Button>
            <div className="flex items-center ml-auto">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" disabled={!threadId}>
                        <MoreVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                    <DropdownMenuItem>Star thread</DropdownMenuItem>
                    <DropdownMenuItem>Add label</DropdownMenuItem>
                    <DropdownMenuItem>Mute thread</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        </div>

        <Separator />
    </div>
}

export default ThreadDisplay