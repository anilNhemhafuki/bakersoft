import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortConfig } from "@/hooks/useTableSort";

import { TableHead as NewTableHead } from "./table";
import { ArrowUpDown } from "lucide-react";
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
    <NewTableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </NewTableHead>
  );
}