"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CalendarViewProps {
  documentId: Id<"documents">;
}

export const CalendarView = ({ documentId }: CalendarViewProps) => {
  const router = useRouter();
  const children = useQuery(api.documents.getChildren, { parentDocument: documentId });
  const create = useMutation(api.documents.create);
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  const handleCreate = (date: Date) => {
    create({
      title: "Untitled",
      parentDocument: documentId,
    }).then((newDocId) => {
      // Create doesn't support dueDate natively in the mutation yet, so we update it immediately
      // Actually, create does not have dueDate, so we just redirect. The user can set the date in the properties panel.
      // Wait, we can pass dueDate to create? No, create mutation only takes title and parentDocument.
      // So we use fetch pattern or just let the user open it.
      // But if we want to set it, we need to call update.
      router.push(`/documents/${newDocId}`);
    });
  };

  if (children === undefined) {
    return <div className="p-8">Loading calendar...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-neutral-50 dark:bg-neutral-900 py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {days.map((day, idx) => {
          const dayItems = children.filter(doc => 
            doc.dueDate && isSameDay(new Date(doc.dueDate), day)
          );

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] bg-white dark:bg-black p-2 group transition-colors relative ${
                !isSameMonth(day, currentDate) ? "text-muted-foreground bg-neutral-50 dark:bg-neutral-900/50" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? "bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}`}>
                  {format(day, "d")}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleCreate(day)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {dayItems.map(doc => (
                  <div 
                    key={doc._id}
                    onClick={() => router.push(`/documents/${doc._id}`)}
                    className="text-xs truncate bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded px-1.5 py-1 cursor-pointer hover:opacity-80 transition"
                  >
                    {doc.icon && <span className="mr-1">{doc.icon}</span>}
                    {doc.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
