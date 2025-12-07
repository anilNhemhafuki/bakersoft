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
} from "lucide-react";

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/analytics/sales",
      { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date().toISOString() },
    ],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (error && isUnauthorizedError(error)) {
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

  const viewReport = (reportName: string) => {
    toast({
      title: "Opening Report",
      description: `${reportName} is being generated...`,
    });
  };

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
    if (activeTab === "all") return true;
    return category.id === activeTab;
  });

  const searchFilteredCategories = filteredCategories.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Various Reports</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="income-expense">Income Expense</TabsTrigger>
          <TabsTrigger value="business">Business Status</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
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

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(
                    analytics?.salesData?.reduce(
                      (sum: number, day: any) => sum + day.sales,
                      0,
                    ) || 0,
                  )}
                </p>
                <p className="text-sm text-green-600">Last 30 days</p>
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
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics?.salesData?.reduce(
                    (sum: number, day: any) => sum + day.orders,
                    0,
                  ) || 0}
                </p>
                <p className="text-sm text-blue-600">Last 30 days</p>
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
                <p className="text-sm font-medium text-gray-500">
                  Average Order
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(
                    analytics?.salesData?.length > 0
                      ? analytics.salesData.reduce(
                          (sum: number, day: any) => sum + day.sales,
                          0,
                        ) /
                          analytics.salesData.reduce(
                            (sum: number, day: any) => sum + day.orders,
                            0,
                          )
                      : 0,
                  )}
                </p>
                <p className="text-sm text-purple-600">Per order value</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Products in Stock
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.productsInStock || 0}
                </p>
                <p className="text-sm text-orange-600">
                  {stats?.lowStockItems || 0} low stock
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}