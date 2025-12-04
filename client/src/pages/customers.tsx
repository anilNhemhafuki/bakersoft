
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  PermissionWrapper,
  ReadOnlyWrapper,
} from "@/components/permission-wrapper";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/search-bar";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHeader } from "@/components/ui/sortable-table-header";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Eye,
  Download,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useCurrency } from "@/hooks/useCurrency";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { format } from "date-fns";
import {
  Pagination,
  PaginationInfo,
  PageSizeSelector,
  usePagination,
} from "@/components/ui/pagination";

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  openingBalance: number;
  currentBalance: number;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LedgerTransaction {
  id: number;
  transactionDate: string;
  description: string;
  referenceNumber?: string;
  debitAmount: string;
  creditAmount: string;
  runningBalance: string;
  transactionType: string;
  paymentMethod?: string;
  notes?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  openingBalance?: string;
}

interface TransactionFormErrors {
  transactionType?: string;
  amount?: string;
  description?: string;
  transactionDate?: string;
}

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [transactionErrors, setTransactionErrors] =
    useState<TransactionFormErrors>({});
  const { formatCurrency } = useCurrency();

  const {
    data: customersResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response;
    },
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const customers = Array.isArray(customersResponse?.data)
    ? customersResponse.data
    : Array.isArray(customersResponse?.items)
    ? customersResponse.items
    : Array.isArray(customersResponse)
    ? customersResponse
    : [];

  // Check URL parameters for auto-opening ledger
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewLedgerParam = urlParams.get("viewLedger");

    if (viewLedgerParam && Array.isArray(customers) && customers.length > 0) {
      const customerId = parseInt(viewLedgerParam);
      const customer = customers.find((c: Customer) => c.id === customerId);

      if (customer) {
        setSelectedCustomer(customer);
        setIsLedgerDialogOpen(true);
        // Clear the URL parameter
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [customers]);

  const { data: ledgerTransactions = [] } = useQuery({
    queryKey: ["/api/ledger/customer", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormErrors({});
      toast({ title: "Success", description: "Customer saved successfully" });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to save customer",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormErrors({});
      toast({ title: "Success", description: "Customer updated successfully" });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to update customer",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Success", description: "Customer deleted successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const transactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/ledger", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/ledger/customer", selectedCustomer?.id],
      });
      setIsTransactionDialogOpen(false);
      setTransactionType("");
      setTransactionErrors({});
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setTransactionErrors(error.response.data.errors);
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to add transaction",
          variant: "destructive",
        });
      }
    },
  });

  const validateForm = (formData: FormData): boolean => {
    const errors: FormErrors = {};

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const openingBalance = formData.get("openingBalance") as string;

    if (!name || name.trim().length < 2) {
      errors.name = "Customer name must be at least 2 characters long";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    if (openingBalance && isNaN(parseFloat(openingBalance))) {
      errors.openingBalance = "Opening balance must be a valid number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTransactionForm = (formData: FormData): boolean => {
    const errors: TransactionFormErrors = {};

    const amount = formData.get("amount") as string;
    const description = formData.get("description") as string;
    const transactionDate = formData.get("transactionDate") as string;

    if (!transactionType) {
      errors.transactionType = "Please select a transaction type";
    }

    if (!amount || amount.trim() === "") {
      errors.amount = "Amount is required";
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.amount = "Amount must be a positive number";
    } else if (parseFloat(amount) > 999999999.99) {
      errors.amount = "Amount is too large";
    }

    if (!description || description.trim().length < 3) {
      errors.description = "Description must be at least 3 characters long";
    } else if (description.trim().length > 500) {
      errors.description = "Description is too long (max 500 characters)";
    }

    if (!transactionDate) {
      errors.transactionDate = "Transaction date is required";
    } else {
      const selectedDate = new Date(transactionDate);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      if (selectedDate > today) {
        errors.transactionDate = "Transaction date cannot be in the future";
      } else if (selectedDate < oneYearAgo) {
        errors.transactionDate =
          "Transaction date cannot be more than 1 year ago";
      }
    }

    setTransactionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTransactionSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    if (!validateTransactionForm(formData)) {
      return;
    }

    const amount = parseFloat(formData.get("amount") as string);
    const isDebit =
      transactionType === "sale" || transactionType === "adjustment_debit";

    const data = {
      customerOrPartyId: selectedCustomer?.id,
      entityType: "customer",
      transactionDate: formData.get("transactionDate") as string,
      description: formData.get("description") as string,
      referenceNumber: formData.get("referenceNumber") as string,
      debitAmount: isDebit ? amount : 0,
      creditAmount: !isDebit ? amount : 0,
      transactionType,
      paymentMethod: formData.get("paymentMethod") as string,
      notes: formData.get("notes") as string,
    };

    transactionMutation.mutate(data);
  };

  const exportLedger = () => {
    const csvContent = [
      ["Date", "Description", "Reference", "Debit", "Credit", "Balance"].join(
        ",",
      ),
      ...ledgerTransactions.map((txn: LedgerTransaction) =>
        [
          format(new Date(txn.transactionDate), "dd/MM/yyyy"),
          txn.description,
          txn.referenceNumber || "",
          txn.debitAmount,
          txn.creditAmount,
          txn.runningBalance,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCustomer?.name}_ledger.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Ledger exported to CSV file",
    });
  };

  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: Customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" ? customer.isActive : !customer.isActive);
    return matchesSearch && matchesStatus;
  }) : [];

  // Add sorting functionality
  const { sortedData, sortConfig, requestSort } = useTableSort(
    filteredCustomers,
    "name",
  );

  // Add pagination
  const {
    currentItems: paginatedCustomers,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  } = usePagination(sortedData, 10);

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  const getBalanceBadge = (balance: any) => {
    const amount = parseFloat(balance || 0);
    if (amount > 0) {
      return {
        variant: "destructive" as const,
        text: `Dr. ${formatCurrency(amount)}`,
      };
    } else if (amount < 0) {
      return {
        variant: "default" as const,
        text: `Cr. ${formatCurrency(Math.abs(amount))}`,
      };
    }
    return { variant: "secondary" as const, text: formatCurrency(0) };
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    ledgerTransactions.forEach((txn: LedgerTransaction) => {
      totalDebit += parseFloat(txn.debitAmount) || 0;
      totalCredit += parseFloat(txn.creditAmount) || 0;
    });

    return { totalDebit, totalCredit };
  };

  if (error) {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }
    console.error("Error loading customers:", error);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const errors: FormErrors = {};
    const name = formData.get("name") as string;

    if (!name?.trim()) {
      errors.name = "Customer name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Customer name must be at least 2 characters long";
    }

    // Validate email format if provided
    const email = formData.get("email") as string;
    if (email && email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    // Validate opening balance if provided
    const openingBalance = formData.get("openingBalance") as string;
    if (openingBalance && openingBalance.trim() && isNaN(parseFloat(openingBalance))) {
      errors.openingBalance = "Please enter a valid number";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    const customerData = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      address: (formData.get("address") as string)?.trim() || null,
      openingBalance: openingBalance?.trim() || "0",
      currentBalance: openingBalance?.trim() || "0",
      totalOrders: 0,
      totalSpent: "0",
      isActive: (formData.get("isActive") as string) === "true",
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: customerData });
    } else {
      createMutation.mutate(customerData);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-600">
            Manage your customer information and relationships with complete transaction history
          </p>
        </div>
        <PermissionWrapper resource="customers" action="write">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingCustomer(null);
                setFormErrors({});
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCustomer(null);
                  setFormErrors({});
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>
                <DialogDescription>Enter customer details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter customer name"
                      defaultValue={editingCustomer?.name || ""}
                      className={formErrors.name ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.name && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {formErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      defaultValue={editingCustomer?.email || ""}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {formErrors.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Enter phone number"
                      defaultValue={editingCustomer?.phone || ""}
                      className={formErrors.phone ? "border-red-500" : ""}
                    />
                    {formErrors.phone && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {formErrors.phone}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Select
                      name="isActive"
                      defaultValue={editingCustomer?.isActive ? "true" : "true"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter complete address"
                    defaultValue={editingCustomer?.address || ""}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Opening Balance</Label>
                  <Input
                    id="openingBalance"
                    name="openingBalance"
                    type="number"
                    step="0.01"
                    placeholder="Enter opening balance (positive for debit, negative for credit)"
                    defaultValue={editingCustomer?.openingBalance || "0"}
                    className={
                      formErrors.openingBalance ? "border-red-500" : ""
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Positive values represent amounts they owe you (debit),
                    negative values represent amounts you owe them (credit)
                  </p>
                  {formErrors.openingBalance && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.openingBalance}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="w-full sm:w-auto"
                  >
                    {editingCustomer ? "Update Customer" : "Create Customer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionWrapper>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Customers List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <SearchBar
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader
                      label="Customer"
                      sortKey="name"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    />
                    <SortableTableHeader
                      label="Contact"
                      sortKey="email"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                      className="hidden sm:table-cell"
                    />
                    <SortableTableHeader
                      label="Balance"
                      sortKey="currentBalance"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    />
                    <SortableTableHeader
                      label="Orders"
                      sortKey="totalOrders"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    />
                    <SortableTableHeader
                      label="Total Spent"
                      sortKey="totalSpent"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    />
                    <SortableTableHeader
                      label="Status"
                      sortKey="isActive"
                      sortConfig={sortConfig}
                      onSort={requestSort}
                    />
                    <SortableTableHeader label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers && paginatedCustomers.length > 0 ? (
                    paginatedCustomers.map((customer: Customer) => {
                    const balanceInfo = getBalanceBadge(customer.currentBalance);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {customer.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm">
                            {customer.email && <div>{customer.email}</div>}
                            {customer.phone && (
                              <div className="text-muted-foreground">
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={balanceInfo.variant}>
                            {balanceInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {customer.totalOrders || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            {formatCurrency(customer.totalSpent || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(customer.isActive)}>
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <PermissionWrapper resource="customers" action="read">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setIsLedgerDialogOpen(true);
                                }}
                                className="text-green-600 hover:text-green-800 focus:outline-none"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </PermissionWrapper>
                            <PermissionWrapper
                              resource="customers"
                              action="write"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setIsTransactionDialogOpen(true);
                                }}
                                title="Add Transaction"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setFormErrors({});
                                  setIsDialogOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmationDialog
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-800 focus:outline-none"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                }
                                title="Delete Customer"
                                itemName={customer.name}
                                onConfirm={() =>
                                  deleteMutation.mutate(customer.id)
                                }
                                isLoading={deleteMutation.isPending}
                              />
                            </PermissionWrapper>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery || statusFilter !== "all"
                              ? 'No customers match your search criteria.'
                              : 'Start by adding your first customer.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {filteredCustomers.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <PaginationInfo
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalItems}
                  />
                  <div className="flex items-center gap-4">
                    <PageSizeSelector
                      pageSize={pageSize}
                      onPageSizeChange={handlePageSizeChange}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog
        open={isTransactionDialogOpen}
        onOpenChange={(open) => {
          setIsTransactionDialogOpen(open);
          if (!open) {
            setTransactionType("");
            setTransactionErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Transaction for {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Record a new transaction to track debits and credits for this
              customer
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTransactionSave} className="space-y-6">
            {/* Transaction Type Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="transactionType"
                      className="text-sm font-medium"
                    >
                      Transaction Type *
                    </Label>
                    <Select
                      value={transactionType}
                      onValueChange={setTransactionType}
                      required
                    >
                      <SelectTrigger
                        className={
                          transactionErrors.transactionType
                            ? "border-red-500"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">
                          <div className="flex flex-col">
                            <span className="font-medium">Sale</span>
                            <span className="text-xs text-muted-foreground">
                              They owe us (Debit)
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="payment_received">
                          <div className="flex flex-col">
                            <span className="font-medium">Payment Received</span>
                            <span className="text-xs text-muted-foreground">
                              They paid us (Credit)
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="adjustment_debit">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              Adjustment (Debit)
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Increase what they owe us
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="adjustment_credit">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              Adjustment (Credit)
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Decrease what they owe us
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {transactionErrors.transactionType && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {transactionErrors.transactionType}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="transactionDate"
                      className="text-sm font-medium"
                    >
                      Transaction Date *
                    </Label>
                    <Input
                      id="transactionDate"
                      name="transactionDate"
                      type="date"
                      defaultValue={format(new Date(), "yyyy-MM-dd")}
                      className={
                        transactionErrors.transactionDate
                          ? "border-red-500"
                          : ""
                      }
                      required
                    />
                    {transactionErrors.transactionDate && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {transactionErrors.transactionDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Enter detailed transaction description"
                    className={
                      transactionErrors.description ? "border-red-500" : ""
                    }
                    required
                  />
                  {transactionErrors.description && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {transactionErrors.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Amount and Payment Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount *
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className={
                        transactionErrors.amount ? "border-red-500" : ""
                      }
                      required
                    />
                    {transactionErrors.amount && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {transactionErrors.amount}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="paymentMethod"
                      className="text-sm font-medium"
                    >
                      Payment Method
                    </Label>
                    <Select name="paymentMethod">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="referenceNumber"
                    className="text-sm font-medium"
                  >
                    Reference Number
                  </Label>
                  <Input
                    id="referenceNumber"
                    name="referenceNumber"
                    placeholder="Invoice number, receipt number, etc. (optional)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter invoice number, receipt number, or any reference for
                    this transaction
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional notes, terms, or conditions (optional)"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Impact Preview */}
            {transactionType && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-900">
                      Account Impact
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {transactionType === "sale" &&
                      "This will increase the amount owed by the customer (Debit their account)"}
                    {transactionType === "payment_received" &&
                      "This will decrease the amount owed by the customer (Credit their account)"}
                    {transactionType === "adjustment_debit" &&
                      "This will increase the customer's account balance (Debit adjustment)"}
                    {transactionType === "adjustment_credit" &&
                      "This will decrease the customer's account balance (Credit adjustment)"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTransactionDialogOpen(false);
                  setTransactionType("");
                  setTransactionErrors({});
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={transactionMutation.isPending || !transactionType}
                className="w-full sm:w-auto"
              >
                {transactionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Transaction...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ledger View Dialog */}
      <Dialog open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
        <DialogContent className="max-w-6xl mx-auto max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Customer Ledger - {selectedCustomer?.name}</DialogTitle>
                <DialogDescription>
                  Complete transaction history with debit/credit tracking
                </DialogDescription>
              </div>
              <Button variant="outline" onClick={exportLedger}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Total Debits
                </div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(calculateTotals().totalDebit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Total Credits
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(calculateTotals().totalCredit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Net Balance</div>
                <div
                  className={`text-lg font-semibold ${
                    parseFloat(selectedCustomer?.currentBalance?.toString() || "0") >= 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {getBalanceBadge(selectedCustomer?.currentBalance).text}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-y-auto max-h-[50vh] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerTransactions.map((transaction: LedgerTransaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(
                        new Date(transaction.transactionDate),
                        "dd/MM/yyyy",
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.description}
                        </div>
                        {transaction.notes && (
                          <div className="text-sm text-muted-foreground">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.referenceNumber || "-"}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(transaction.debitAmount) > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(parseFloat(transaction.debitAmount))}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {parseFloat(transaction.creditAmount) > 0 ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(parseFloat(transaction.creditAmount))}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          parseFloat(transaction.runningBalance) >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(
                          Math.abs(parseFloat(transaction.runningBalance)),
                        )}
                        {parseFloat(transaction.runningBalance) >= 0
                          ? " Dr"
                          : " Cr"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {ledgerTransactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No transactions found. Click the "+" button to add the
                      first transaction.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
