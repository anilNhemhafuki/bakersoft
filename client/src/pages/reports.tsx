
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useCurrency } from "@/hooks/useCurrency";
import {
  FileText,
  TrendingUp,
  ShoppingCart,
  Banknote,
  Search,
  ArrowRight,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("analytics");
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  // Fetch all data sources
  const { data: sales = [] } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  const { data: salesReturnsResponse } = useQuery<any>({
    queryKey: ["/api/sales-returns"],
  });
  const salesReturns = Array.isArray(salesReturnsResponse) ? salesReturnsResponse : (salesReturnsResponse?.data || []);

  const { data: purchases = [] } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: purchaseReturnsResponse } = useQuery<any>({
    queryKey: ["/api/purchase-returns"],
  });
  const purchaseReturns = Array.isArray(purchaseReturnsResponse) ? purchaseReturnsResponse : (purchaseReturnsResponse?.data || []);

  const { data: expenses = [] } = useQuery<any[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const viewReport = (reportName: string) => {
    toast({
      title: "Opening Report",
      description: `${reportName} is being generated...`,
    });
  };

  // Chart colors
  const COLORS = {
    primary: "#16a34a",
    secondary: "#0ea5e9",
    accent: "#f59e0b",
    danger: "#ef4444",
    purple: "#a855f7",
    pink: "#ec4899",
  };

  // Process sales data for charts
  const processSalesData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, "yyyy-MM-dd");
    });

    return last30Days.map((date) => {
      const daySales = sales.filter(
        (sale: any) => format(new Date(sale.saleDate || sale.createdAt), "yyyy-MM-dd") === date
      );
      const dayReturns = salesReturns.filter(
        (ret: any) => format(new Date(ret.returnDate), "yyyy-MM-dd") === date
      );

      return {
        date: format(new Date(date), "MMM dd"),
        sales: daySales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || 0), 0),
        returns: dayReturns.reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
        netSales: daySales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || 0), 0) -
          dayReturns.reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
      };
    });
  };

  // Process purchase data for charts
  const processPurchaseData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, "yyyy-MM-dd");
    });

    return last30Days.map((date) => {
      const dayPurchases = purchases.filter(
        (purchase: any) => format(new Date(purchase.purchaseDate || purchase.createdAt), "yyyy-MM-dd") === date
      );
      const dayReturns = purchaseReturns.filter(
        (ret: any) => format(new Date(ret.returnDate), "yyyy-MM-dd") === date
      );

      return {
        date: format(new Date(date), "MMM dd"),
        purchases: dayPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || 0), 0),
        returns: dayReturns.reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
      };
    });
  };

  // Process expense categories
  const processExpensesByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach((expense: any) => {
      const category = expense.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount || 0);
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Process inventory stock levels
  const processInventoryStock = () => {
    return inventory
      .filter((item: any) => parseFloat(item.currentStock || 0) > 0)
      .slice(0, 10)
      .map((item: any) => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
        currentStock: parseFloat(item.currentStock || 0),
        minLevel: parseFloat(item.minLevel || 0),
      }));
  };

  // Process payment methods distribution
  const processPaymentMethods = () => {
    const methodTotals: Record<string, number> = {};
    
    [...sales, ...purchases].forEach((txn: any) => {
      const method = txn.paymentMethod || "Unknown";
      methodTotals[method] = (methodTotals[method] || 0) + 1;
    });

    return Object.entries(methodTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Process monthly revenue vs expenses
  const processMonthlyComparison = () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subDays(new Date(), i * 30);
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, "MMM yyyy"),
      };
    }).reverse();

    return months.map(({ start, end, label }) => {
      const monthSales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });

      const monthExpenses = expenses.filter((expense: any) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      const revenue = monthSales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || 0), 0);
      const expenseTotal = monthExpenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

      return {
        month: label,
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
      };
    });
  };

  const salesData = processSalesData();
  const purchaseData = processPurchaseData();
  const expenseCategories = processExpensesByCategory();
  const inventoryStock = processInventoryStock();
  const paymentMethods = processPaymentMethods();
  const monthlyComparison = processMonthlyComparison();

  const reportCategories = [
    {
      id: "transactions",
      title: "Transaction Report",
      items: [
        {
          title: "Sales",
          description: "View your sales data on a given time",
          icon: <TrendingUp className="h-5 w-5" />,
        },
        {
          title: "Purchase",
          description: "View your purchase data on a given time",
          icon: <ShoppingCart className="h-5 w-5" />,
        },
        {
          title: "Sales Return",
          description: "View your sales return data on a given time",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Purchase Return",
          description: "View your purchase return data on a given time",
          icon: <FileText className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "daybook",
      title: "Day Book & Reports",
      items: [
        {
          title: "Day Book",
          description: "View all of your daily transactions",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "All Party Transactions",
          description: "View all party transactions in a given time",
          icon: <FileText className="h-5 w-5" />,
          badge: "View Report",
        },
        {
          title: "Profit And Loss",
          description: "View your profit & loss in a given time",
          icon: <Banknote className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "parties",
      title: "Party Report",
      items: [
        {
          title: "Party Statement",
          description: "View party statement for a given time",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "All Parties Report",
          description: "View all parties transactions",
          icon: <FileText className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "inventory",
      title: "Inventory Report",
      items: [
        {
          title: "Stock Summary",
          description: "View stock summary report",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Stock Detail",
          description: "View detailed stock report",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Low Stock Items",
          description: "View items with low stock levels",
          icon: <FileText className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "income-expense",
      title: "Income & Expense Report",
      items: [
        {
          title: "Income Summary",
          description: "View all income transactions",
          icon: <Banknote className="h-5 w-5" />,
        },
        {
          title: "Expense Summary",
          description: "View all expense transactions",
          icon: <Banknote className="h-5 w-5" />,
        },
        {
          title: "Income vs Expense",
          description: "Compare income and expenses",
          icon: <TrendingUp className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "business",
      title: "Business Status",
      items: [
        {
          title: "Balance Sheet",
          description: "View your business balance sheet",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Trial Balance",
          description: "View trial balance report",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Cash Flow",
          description: "View cash flow statement",
          icon: <Banknote className="h-5 w-5" />,
        },
      ],
    },
  ];

  const filteredCategories = reportCategories.filter((category) => {
    if (typeFilter === "all") return true;
    return category.id === typeFilter;
  });

  const searchFilteredCategories = filteredCategories.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive business insights and data visualization</p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            Standard Reports
          </TabsTrigger>
        </TabsList>

        {/* Analytics Dashboard Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* Sales Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-600" />
                Sales & Returns Trend (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sales: { label: "Sales", color: COLORS.primary },
                  returns: { label: "Returns", color: COLORS.danger },
                  netSales: { label: "Net Sales", color: COLORS.secondary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="sales" stroke={COLORS.primary} strokeWidth={2} />
                    <Line type="monotone" dataKey="returns" stroke={COLORS.danger} strokeWidth={2} />
                    <Line type="monotone" dataKey="netSales" stroke={COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Purchase Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Purchase & Returns Trend (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  purchases: { label: "Purchases", color: COLORS.secondary },
                  returns: { label: "Returns", color: COLORS.danger },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchaseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="purchases" fill={COLORS.secondary} />
                    <Bar dataKey="returns" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Two Column Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Amount", color: COLORS.accent },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill={COLORS.accent}
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-purple-600" />
                  Payment Methods Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Transactions", color: COLORS.purple },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill={COLORS.purple}
                        dataKey="value"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue vs Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Monthly Revenue vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: COLORS.primary },
                  expenses: { label: "Expenses", color: COLORS.danger },
                  profit: { label: "Profit", color: COLORS.secondary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="revenue" fill={COLORS.primary} />
                    <Bar dataKey="expenses" fill={COLORS.danger} />
                    <Bar dataKey="profit" fill={COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Inventory Stock Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Top 10 Inventory Stock Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  currentStock: { label: "Current Stock", color: COLORS.secondary },
                  minLevel: { label: "Min Level", color: COLORS.danger },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryStock}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="currentStock" fill={COLORS.secondary} />
                    <Bar dataKey="minLevel" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        sales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        purchases.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Products in Stock</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats?.productsInStock || products.length}
                    </p>
                    <p className="text-sm text-orange-600">{stats?.lowStockItems || 0} low stock</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Standard Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Report Categories */}
          <div className="space-y-8">
            {searchFilteredCategories.map((category) => (
              <div key={category.id}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {category.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.items.map((item, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => viewReport(item.title)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700">
                              {item.icon}
                            </div>
                            {item.badge && (
                              <Badge variant="outline" className="text-xs">
                                {item.badge} <ArrowRight className="h-3 w-3 ml-1" />
                              </Badge>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
