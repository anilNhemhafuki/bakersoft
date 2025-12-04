import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { TableHead } from "./table";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface SortableTableHeaderProps {
  label?: string;
  children?: React.ReactNode;
  sortKey?: string;
  currentSort?: SortConfig | null;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  className?: string;
}

export function SortableTableHeader({
  label,
  children,
  sortKey,
  currentSort,
  sortConfig,
  onSort,
  className = "",
}: SortableTableHeaderProps) {
  const displayLabel = label || children;
  const sort = currentSort || sortConfig;
  const isActive = sort && sortKey && sort.key === sortKey;
  const direction = isActive ? sort?.direction : null;

  if (!sortKey || !onSort) {
    return (
      <TableHead className={cn("font-medium", className)}>
        {displayLabel}
      </TableHead>
    );
  }

  return (
    <TableHead className={cn("p-0", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-2 font-medium text-muted-foreground hover:text-foreground",
          isActive && "text-foreground"
        )}
        onClick={() => onSort(sortKey)}
        data-testid={`sort-${sortKey}`}
      >
        <span>{displayLabel}</span>
        {direction === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : direction === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );
}