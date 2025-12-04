import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: "asc" | "desc" };
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className = "",
}: SortableTableHeaderProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}