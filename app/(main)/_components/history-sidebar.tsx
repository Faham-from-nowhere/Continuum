"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";

interface HistorySidebarProps {
  documentId: Id<"documents">;
  isOpen: boolean;
  onClose: () => void;
}

export const HistorySidebar = ({ documentId, isOpen, onClose }: HistorySidebarProps) => {
  const versions = useQuery(api.documents.getVersions, { documentId });
  const update = useMutation(api.documents.update);

  const handleRestore = (content: string) => {
    const promise = update({
      id: documentId,
      content,
    });

    toast.promise(promise, {
      loading: "Restoring version...",
      success: "Version restored successfully!",
      error: "Failed to restore version.",
    });
    
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Version History
          </SheetTitle>
          <SheetDescription>
            View and restore previous versions of this document. Snapshots are taken automatically every 5 minutes while editing.
          </SheetDescription>
        </SheetHeader>

        {versions === undefined ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading history...
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Clock className="h-10 w-10 opacity-20" />
            <p>No previous versions found.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 mt-4 pr-4">
            <div className="flex flex-col gap-4">
              {versions.map((version, idx) => (
                <div key={version._id} className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col gap-3 group">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {idx === 0 ? "Latest Version" : `Version ${versions.length - idx}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRestore(version.content)}
                      className="opacity-0 group-hover:opacity-100 transition"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2 max-h-[100px] overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                    {/* Render a plain text preview of the JSON content */}
                    {(() => {
                      try {
                        const parsed = JSON.parse(version.content);
                        if (Array.isArray(parsed)) {
                          return parsed.map((b: any) => 
                            b.content ? (Array.isArray(b.content) ? b.content.map((c:any) => c.text).join("") : b.content) : ""
                          ).join(" ").substring(0, 150) + "...";
                        }
                        return "Preview not available.";
                      } catch {
                        return "Preview not available.";
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
