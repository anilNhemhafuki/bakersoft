import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUnits } from "@/hooks/useUnits";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchBar from "@/components/search-bar";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHeader } from "@/components/ui/sortable-table-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Ruler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

export default function Units() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const { toast } = useToast();

  // Fetch units using the custom hook
  const {
    data: units = [],
    isLoading,
    error,
    refetch: refetchUnits,
  } = useUnits();

  // Debug logging
  console.log("Units page - Data received:", units);
  console.log("Units page - Is loading:", isLoading);
  console.log("Units page - Error:", error);

  // Ensure units is always an array
  const unitsArray = Array.isArray(units) ? units : [];
  console.log("Units page - Array after processing:", unitsArray);

  // Filter units by search query
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return unitsArray;

    return unitsArray.filter(
      (unit: any) =>
        unit.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.type?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [unitsArray, searchQuery]);

  // Sort the filtered units
  const { sortedData, sortConfig, requestSort } = useTableSort(
    filteredUnits,
    "name",
  );

  // Debug sorting
  console.log("Filtered units count:", filteredUnits.length);
  console.log("Sorted data count:", sortedData.length);
  console.log("Current sort config:", sortConfig);

  // Mutation hooks
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating unit with data:", data);
      const response = await apiRequest("POST", "/api/units", data);
      console.log("Create unit response:", response);
      return response;
    },
    onSuccess: (response) => {
      console.log("Unit created successfully:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      refetchUnits();
      setIsDialogOpen(false);
      setEditingUnit(null);

      // Handle both response formats
      const unitName = response?.data?.name || response?.name || "Unit";

      toast({
        title: "Success",
        description: `Unit "${unitName}" created successfully`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 500);
        return;
      }
      const message = error?.message || "Failed to create unit";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; values: any }) => {
      console.log("Updating unit:", data.id, "with values:", data.values);
      const response = await apiRequest(
        "PUT",
        `/api/units/${data.id}`,
        data.values,
      );
      console.log("Update unit response:", response);
      return response;
    },
    onSuccess: (response) => {
      console.log("Unit updated successfully:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      refetchUnits();
      setIsDialogOpen(false);
      setEditingUnit(null);

      // Handle both response formats
      const unitName = response?.data?.name || response?.name || "Unit";

      toast({
        title: "Success",
        description: `Unit "${unitName}" updated successfully`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to update unit",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/units/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      refetchUnits();
      toast({
        title: "Success",
        description: "Unit deleted successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 500);
        return;
      }

      const errorMessage = error?.message || "Failed to delete unit";
      const isConstraintError =
        errorMessage.includes("being used") ||
        errorMessage.includes("FOREIGN_KEY");

      toast({
        title: isConstraintError ? "Cannot Delete Unit" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/units/${data.id}`, {
        isActive: data.isActive,
      });
      return { response, newIsActive: data.isActive };
    },
    onSuccess: ({ response, newIsActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      refetchUnits();
      const unitName = response?.data?.name || response?.name || "Unit";
      toast({
        title: "Success",
        description: `Unit "${unitName}" ${newIsActive ? "activated" : "deactivated"} successfully`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const abbreviation = formData.get("abbreviation") as string;
    const type = formData.get("type") as string;

    if (!name?.trim() || !abbreviation?.trim() || !type?.trim()) {
      toast({
        title: "Error",
        description: "Name, abbreviation, and type are required",
        variant: "destructive",
      });
      return;
    }

    const unitData = {
      name: name.trim(),
      abbreviation: abbreviation.trim(),
      type: type.trim(),
      baseUnit: (formData.get("baseUnit") as string)?.trim() || null,
      conversionFactor:
        parseFloat(formData.get("conversionFactor") as string) || 1,
      isActive: true,
    };

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, values: unitData });
    } else {
      createMutation.mutate(unitData);
    }
  };

  // Badge type helper
  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case "weight":
        return {
          variant: "default",
          text: "Weight",
          color: "bg-blue-100 text-blue-800",
        };
      case "volume":
        return {
          variant: "secondary",
          text: "Volume",
          color: "bg-green-100 text-green-800",
        };
      case "count":
        return {
          variant: "outline",
          text: "Count",
          color: "bg-gray-100 text-gray-800",
        };
      case "length":
        return {
          variant: "outline",
          text: "Length",
          color: "bg-purple-100 text-purple-800",
        };
      case "area":
        return {
          variant: "outline",
          text: "Area",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "temperature":
        return {
          variant: "outline",
          text: "Temperature",
          color: "bg-red-100 text-red-800",
        };
      default:
        return {
          variant: "outline",
          text: type || "Unknown",
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  // Unauthorized redirect
  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Session Expired",
      description: "Redirecting to login...",
      variant: "destructive",
    });
    setTimeout(() => (window.location.href = "/api/login"), 500);
    return null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-600">
            Manage units for inventory and products
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingUnit(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingUnit(null)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "Edit Unit" : "Add New Unit"}
              </DialogTitle>
              <DialogDescription>Enter unit details below</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSave}
              key={editingUnit?.id || "new"}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Unit Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Kilogram, Liter"
                  defaultValue={editingUnit?.name || ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="abbreviation">Abbreviation</Label>
                <Input
                  id="abbreviation"
                  name="abbreviation"
                  placeholder="e.g., kg, ltr"
                  defaultValue={editingUnit?.abbreviation || ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Unit Type</Label>
                <Select
                  name="type"
                  defaultValue={editingUnit?.type || ""}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingUnit
                    ? "Update Unit"
                    : "Add Unit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <SearchBar
            placeholder="Search units by name, abbr, or type..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading units...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Error Loading Units
              </h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button onClick={refetchUnits}>Retry</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader
                      sortKey="name"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    >
                      Name
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="abbreviation"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    >
                      Abbreviation
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="type"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    >
                      Type
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="isActive"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    >
                      Status
                    </SortableTableHeader>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length > 0 ? (
                    sortedData.map((unit: any) => {
                      const typeBadge = getTypeBadge(unit.type);
                      const isInactive = !unit.isActive;
                      return (
                        <TableRow
                          key={unit.id}
                          className={isInactive ? "opacity-60 bg-muted/30" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${isInactive ? "bg-muted" : "bg-primary/10"}`}
                              >
                                <Ruler
                                  className={`h-4 w-4 ${isInactive ? "text-muted-foreground" : "text-primary"}`}
                                />
                              </div>
                              <div
                                className={`font-medium ${isInactive ? "text-muted-foreground" : ""}`}
                              >
                                {unit.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code
                              className={`px-2 py-1 rounded text-sm ${isInactive ? "bg-muted text-muted-foreground" : "bg-gray-100 "}`}
                            >
                              {unit.abbreviation}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isInactive
                                  ? "outline"
                                  : (typeBadge.variant as any)
                              }
                              className={isInactive ? "opacity-70" : ""}
                            >
                              {typeBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                unit.isActive ? "default" : "destructive"
                              }
                              className={
                                unit.isActive
                                  ? "bg-green-600 dark:bg-green-700"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }
                            >
                              {unit.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-800 dark:text-blue-400"
                                onClick={() => {
                                  setEditingUnit(unit);
                                  setIsDialogOpen(true);
                                }}
                                title="Edit"
                                data-testid={`button-edit-unit-${unit.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={
                                  unit.isActive ? "destructive" : "default"
                                }
                                size="sm"
                                className={
                                  unit.isActive
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }
                                onClick={() =>
                                  toggleActiveMutation.mutate({
                                    id: unit.id,
                                    isActive: !unit.isActive,
                                  })
                                }
                                disabled={toggleActiveMutation.isPending}
                                data-testid={`button-toggle-unit-${unit.id}`}
                              >
                                {unit.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <DeleteConfirmationDialog
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title="Delete"
                                    data-testid={`button-delete-unit-${unit.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-800 dark:text-red-400" />
                                  </Button>
                                }
                                title="Delete Unit"
                                itemName={unit.name}
                                onConfirm={() => deleteMutation.mutate(unit.id)}
                                isLoading={deleteMutation.isPending}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? "No matching units found. Try a different search."
                            : "No units available. Add your first unit."}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
