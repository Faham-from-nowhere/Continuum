"use client";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import dynamic from "next/dynamic";
import { use, useMemo, useState } from "react";
import { LiveblocksRoomProvider } from "@/components/providers/liveblocks-provider";

interface DocumentIdPageProps {
    params: Promise<{
        documentId:Id<"documents">;
    }>;
};

import { LayoutList, KanbanSquare, CalendarDays } from "lucide-react";
import { BoardView } from "@/components/views/board-view";
import { CalendarView } from "@/components/views/calendar-view";

const DocumentIdPage = ({
    params: paramsPromise
}: DocumentIdPageProps) => {
    const Editor = useMemo(()=> dynamic(()=>import("@/components/editor"), {ssr: false}), []);
    const params = use(paramsPromise);
    const documentId = params.documentId;
    const document = useQuery(api.documents.getById, {
        documentId
    });
    const update = useMutation(api.documents.update);
    const [activeView, setActiveView] = useState<"editor" | "board" | "calendar">("editor");

    const handleEditorChange = (content: string) => {
        update({
            id: documentId,
            content
        });
    };

    if(document === undefined){
       return ( <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
            <div className="space-y-4 pl-8 pt-4">
                <Skeleton className="h-14 w-[50%]"/>
                <Skeleton className="h-4 w-[80%]"/>
                <Skeleton className="h-4 w-[40%]"/>
                <Skeleton className="h-4 w-[60%]"/>
            </div>
        </div>
        </div>  )
    }

    if(document === null){
        return ( <div>Not found</div> )
    }

    return (
        <div className="pb-40">
            <Cover url={document.coverImage}/>
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar initialData={document} />
                
                <div className="px-14 flex items-center gap-2 mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-2 mt-4">
                    <button 
                        onClick={() => setActiveView("editor")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${activeView === "editor" ? "bg-neutral-200 dark:bg-neutral-800 text-primary" : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
                    >
                        <LayoutList className="h-4 w-4" /> Editor
                    </button>
                    <button 
                        onClick={() => setActiveView("board")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${activeView === "board" ? "bg-neutral-200 dark:bg-neutral-800 text-primary" : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
                    >
                        <KanbanSquare className="h-4 w-4" /> Board
                    </button>
                    <button 
                        onClick={() => setActiveView("calendar")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${activeView === "calendar" ? "bg-neutral-200 dark:bg-neutral-800 text-primary" : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
                    >
                        <CalendarDays className="h-4 w-4" /> Calendar
                    </button>
                </div>

                {activeView === "editor" && (
                    <LiveblocksRoomProvider roomId={documentId}>
                        <Editor onChange={handleEditorChange} initialContent={document.content} />
                    </LiveblocksRoomProvider>
                )}
                
                {activeView === "board" && (
                    <BoardView documentId={documentId} />
                )}

                {activeView === "calendar" && (
                    <CalendarView documentId={documentId} />
                )}
            </div>
        </div>
    );
}

export default DocumentIdPage;