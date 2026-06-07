"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CircleDashed, CheckCircle2, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface PropertiesPanelProps {
  initialData: Doc<"documents">;
}

export const PropertiesPanel = ({ initialData }: PropertiesPanelProps) => {
  const update = useMutation(api.documents.update);
  const [date, setDate] = useState<Date | undefined>(
    initialData.dueDate ? new Date(initialData.dueDate) : undefined
  );

  const onStatusChange = (status: string) => {
    update({
      id: initialData._id,
      status: status === "clear" ? undefined : status,
    });
  };

  const onDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    update({
      id: initialData._id,
      dueDate: newDate ? newDate.getTime() : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-2 pl-[54px] mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-x-2">
        <div className="w-[120px] text-sm text-muted-foreground flex items-center gap-2">
          <CircleDashed className="h-4 w-4" />
          Status
        </div>
        <Select 
          value={initialData.status || "clear"} 
          onValueChange={onStatusChange}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs bg-transparent border-none hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-none">
            <SelectValue placeholder="Empty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear" className="text-muted-foreground">Clear</SelectItem>
            <SelectItem value="To Do">
              <div className="flex items-center gap-2">
                <CircleDashed className="h-4 w-4 text-slate-500" /> To Do
              </div>
            </SelectItem>
            <SelectItem value="In Progress">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" /> In Progress
              </div>
            </SelectItem>
            <SelectItem value="Done">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Done
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-x-2">
        <div className="w-[120px] text-sm text-muted-foreground flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Date
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[180px] h-8 text-xs justify-start text-left font-normal bg-transparent border-none hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-none"
            >
              {date ? format(date, "PPP") : <span className="text-muted-foreground">Empty</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
