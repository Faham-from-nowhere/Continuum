"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface BoardViewProps {
  documentId: Id<"documents">;
}

const COLUMNS = [
  { id: "To Do", title: "To Do" },
  { id: "In Progress", title: "In Progress" },
  { id: "Done", title: "Done" },
];

export const BoardView = ({ documentId }: BoardViewProps) => {
  const router = useRouter();
  const children = useQuery(api.documents.getChildren, { parentDocument: documentId });
  const update = useMutation(api.documents.update);
  const create = useMutation(api.documents.create);

  if (children === undefined) {
    return (
      <div className="p-8 flex gap-4 h-[500px]">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex-1 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      update({
        id: draggableId as Id<"documents">,
        status: destination.droppableId,
      });
    }
  };

  const handleCreate = (status: string) => {
    create({
      title: "Untitled",
      parentDocument: documentId,
    }).then((newDocId) => {
      update({
        id: newDocId,
        status: status,
      });
      router.push(`/documents/${newDocId}`);
    });
  };

  return (
    <div className="p-8 overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 min-w-max items-start">
          {COLUMNS.map((column) => {
            const columnItems = children.filter((doc) => 
              (doc.status || "To Do") === column.id
            );

            return (
              <div key={column.id} className="flex flex-col gap-4 w-[300px] shrink-0 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3">
                <div className="flex items-center justify-between px-2 font-medium text-sm text-muted-foreground">
                  <span>{column.title}</span>
                  <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-xs">
                    {columnItems.length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[200px] flex flex-col gap-3 transition-colors ${
                        snapshot.isDraggingOver ? "bg-neutral-200/50 dark:bg-neutral-800/50 rounded-md" : ""
                      }`}
                    >
                      {columnItems.map((doc, index) => (
                        <Draggable key={doc._id} draggableId={doc._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 cursor-pointer group shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition ${
                                snapshot.isDragging ? "shadow-lg scale-[1.02]" : ""
                              }`}
                              onClick={() => router.push(`/documents/${doc._id}`)}
                            >
                              <div className="flex items-start gap-2">
                                <div 
                                  {...provided.dragHandleProps} 
                                  className="mt-1 opacity-0 group-hover:opacity-100 transition text-muted-foreground"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="flex-1 font-medium text-sm">
                                  {doc.icon && <span className="mr-2">{doc.icon}</span>}
                                  {doc.title}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground text-xs h-8"
                  onClick={() => handleCreate(column.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
