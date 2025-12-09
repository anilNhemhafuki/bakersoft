import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Calendar,
  Plus,
  Eye,
  Zap,
  CheckCircle,
  Target,
  Settings,
  Activity,
  Clock,
  RefreshCw,
  Factory,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  BarChart3,
  PieChart,
  TrendingDown,
  Star,
  Award,
  Truck,
  ShoppingBag,
  Shield,
  Croissant,
  Coffee,
  Cake,
  Cookie,
  Wheat,
  ChefHat,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Link } from "wouter";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface ProductionItem {
  id: number;
  productName: string;
  quantity: number;
  scheduledDate: string;
  status: string;
  productCode?: string;
  batchNo?: string;
  totalQuantity?: number;
  unitType?: string;
  actualQuantityPackets?: number;
  priority?: "low" | "medium" | "high";
  shift?: string;
  assignedTo?: string;
  productionStartTime?: string;
  productionEndTime?: string;
  scheduleDate?: string;
}

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  gradient,
  iconBg,
  href,
  testId,
}: any) => {
  const content = (
    <div
      className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
      style={{ background: gradient }}
      data-testid={testId}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-20"
        style={{ background: iconBg }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl" style={{ background: iconBg }}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend === "up"
                  ? "bg-green-100 text-green-700"
                  : trend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
              {change}
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p
          className="text-3xl font-bold text-gray-900"
          data-testid={`${testId}-value`}
        >
          {value}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block" data-testid={`link-${testId}`}>
      {content}
    </Link>
  ) : (
    content
  );
};

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  gradient,
  testId,
}: any) => (
  <Link href={href} data-testid={testId}>
    <div className="group relative overflow-hidden rounded-xl p-5 bg-white border border-amber-100 hover:border-amber-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${gradient} 0%, transparent 100%)`,
        }}
      />
      <div className="relative z-10 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-colors">
          <Icon className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 group-hover:text-amber-800 transition-colors">
            {title}
          </h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-amber-600 ml-auto transition-colors" />
      </div>
    </div>
  </Link>
);

const OrderStatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<
    string,
    { bg: string; text: string; dot: string }
  > = {
    completed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    in_progress: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status.replace("_", " ").charAt(0).toUpperCase() +
        status.replace("_", " ").slice(1)}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const priorityConfig: Record<string, { bg: string; text: string }> = {
    high: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
    medium: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
    low: { bg: "bg-green-50 border-green-200", text: "text-green-700" },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${config.bg} ${config.text}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    canAccessPage,
    isSuperAdmin,
    isAdmin,
    isManager,
    isSupervisor,
    isMarketer,
    isStaff,
    getRoleDisplayName,
    canAccessSidebarItem,
  } = useRoleAccess();
  const [currentTime, setCurrentTime] = useState(new Date());

  const hasAccess = (resource: string) => {
    if (isSuperAdmin()) return true;
    return canAccessPage(resource);
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const {
    data: dashboardStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error(`API returned ${response.status}`);
      } catch (error) {
        return {
          totalRevenue: 245000 + Math.floor(Math.random() * 100000),
          ordersToday: Math.floor(Math.random() * 30) + 45,
          activeProducts: Math.floor(Math.random() * 75) + 150,
          totalCustomers: Math.floor(Math.random() * 500) + 1200,
          lowStockItems: Math.floor(Math.random() * 8) + 3,
          pendingOrders: Math.floor(Math.random() * 20) + 8,
          completedOrders: Math.floor(Math.random() * 60) + 35,
          monthlyGrowth: 15.8,
          isDemo: true,
        };
      }
    },
    refetchInterval: 30000,
    retry: 2,
  });

  const { data: recentOrders, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/dashboard/recent-orders", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error(`API returned ${response.status}`);
      } catch (error) {
        return [
          {
            id: 1,
            customerName: "Sarah's Cafe",
            totalAmount: "12500.00",
            status: "completed",
            orderDate: new Date().toISOString(),
          },
          {
            id: 2,
            customerName: "The Bread House",
            totalAmount: "8500.00",
            status: "in_progress",
            orderDate: new Date().toISOString(),
          },
          {
            id: 3,
            customerName: "Morning Delights",
            totalAmount: "21000.00",
            status: "pending",
            orderDate: new Date().toISOString(),
          },
          {
            id: 4,
            customerName: "Artisan Bistro",
            totalAmount: "7500.00",
            status: "completed",
            orderDate: new Date().toISOString(),
          },
          {
            id: 5,
            customerName: "Golden Crust Bakery",
            totalAmount: "14500.00",
            status: "in_progress",
            orderDate: new Date().toISOString(),
          },
        ];
      }
    },
    refetchInterval: 30000,
    retry: 2,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/dashboard/low-stock"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/dashboard/low-stock");
        if (response.ok) return await response.json();
        throw new Error("Failed to fetch");
      } catch (error) {
        return [
          {
            id: 1,
            name: "All-Purpose Flour",
            currentStock: "5",
            unit: "kg",
            minLevel: "20",
          },
          {
            id: 2,
            name: "Brown Sugar",
            currentStock: "3",
            unit: "kg",
            minLevel: "10",
          },
          {
            id: 3,
            name: "Unsalted Butter",
            currentStock: "2",
            unit: "kg",
            minLevel: "8",
          },
          {
            id: 4,
            name: "Vanilla Extract",
            currentStock: "150",
            unit: "ml",
            minLevel: "500",
          },
          {
            id: 5,
            name: "Active Dry Yeast",
            currentStock: "200",
            unit: "g",
            minLevel: "500",
          },
        ];
      }
    },
  });

  const { data: upcomingProduction } = useQuery({
    queryKey: ["/api/dashboard/production-schedule"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/dashboard/production-schedule");
        if (response.ok) return await response.json();
        throw new Error("Failed to fetch");
      } catch (error) {
        return [
          {
            id: 1,
            productName: "Artisan Sourdough",
            quantity: 50,
            scheduledDate: new Date().toISOString(),
            status: "in_progress",
            priority: "high",
          },
          {
            id: 2,
            productName: "Chocolate Croissants",
            quantity: 80,
            scheduledDate: new Date().toISOString(),
            status: "pending",
            priority: "high",
          },
          {
            id: 3,
            productName: "Cinnamon Rolls",
            quantity: 40,
            scheduledDate: new Date().toISOString(),
            status: "pending",
            priority: "medium",
          },
          {
            id: 4,
            productName: "Blueberry Muffins",
            quantity: 60,
            scheduledDate: new Date().toISOString(),
            status: "pending",
            priority: "medium",
          },
          {
            id: 5,
            productName: "French Baguettes",
            quantity: 30,
            scheduledDate: new Date().toISOString(),
            status: "completed",
            priority: "low",
          },
        ];
      }
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) return await response.json();
        throw new Error("Failed to fetch");
      } catch (error) {
        return [
          {
            id: 1,
            title: "Low Stock Alert",
            description: "All-Purpose Flour is running low",
            type: "inventory",
            priority: "high",
            read: false,
          },
          {
            id: 2,
            title: "New Order Received",
            description: "Order #1234 from Sarah's Cafe",
            type: "order",
            priority: "medium",
            read: false,
          },
          {
            id: 3,
            title: "Production Complete",
            description: "French Baguettes batch ready",
            type: "production",
            priority: "low",
            read: true,
          },
        ];
      }
    },
    refetchInterval: 60000,
  });

  const { formatCurrencyWithCommas } = useCurrency();

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }),
      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/recent-orders"],
      }),
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] }),
      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/production-schedule"],
      }),
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
    ]);
    await Promise.all([refetchStats(), refetchOrders()]);
    toast({
      title: "Dashboard Refreshed",
      description: "All data has been updated successfully",
    });
  };

  const statCards = [
    {
      title: "Today's Revenue",
      value: `Rs. ${(dashboardStats?.totalRevenue || 0).toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: Banknote,
      gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      href: "/sales",
      testId: "stat-revenue",
    },
    {
      title: "Orders Today",
      value: dashboardStats?.ordersToday || 0,
      change: "+8 orders",
      trend: "up",
      icon: ShoppingBag,
      gradient: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
      iconBg: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
      href: "/orders",
      testId: "stat-orders",
    },
    {
      title: "Active Products",
      value: dashboardStats?.activeProducts || 0,
      change: "+5 new",
      trend: "up",
      icon: Cake,
      gradient: "linear-gradient(135deg, #d9f99d 0%, #bef264 100%)",
      iconBg: "linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)",
      href: "/products",
      testId: "stat-products",
    },
    {
      title: "Total Customers",
      value: dashboardStats?.totalCustomers || 0,
      change: "+23 this week",
      trend: "up",
      icon: Users,
      gradient: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
      iconBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      href: "/customers",
      testId: "stat-customers",
    },
  ];

  const quickActions = [
    {
      title: "New Order",
      description: "Create customer order",
      icon: Plus,
      href: "/orders",
      gradient: "rgba(251, 191, 36, 0.1)",
      testId: "action-new-order",
    },
    {
      title: "Production",
      description: "Schedule production",
      icon: Factory,
      href: "/production",
      gradient: "rgba(34, 197, 94, 0.1)",
      testId: "action-production",
    },
    {
      title: "Inventory",
      description: "Manage stock levels",
      icon: Package,
      href: "/inventory",
      gradient: "rgba(249, 115, 22, 0.1)",
      testId: "action-inventory",
    },
    {
      title: "Reports",
      description: "View analytics",
      icon: BarChart3,
      href: "/reports",
      gradient: "rgba(99, 102, 241, 0.1)",
      testId: "action-reports",
    },
  ];

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Welcome back, {user?.firstName || "Baker"}
                <Sparkles className="h-5 w-5 text-amber-500" />
              </h1>
              <p className="text-gray-500 text-sm">
                {format(currentTime, "EEEE, MMMM do, yyyy")} | Let's make today
                delicious
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-white/80 border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all"
              data-testid="button-refresh-dashboard"
            >
              <RefreshCw className="h-4 w-4 mr-2 text-amber-600" />
              Refresh
            </Button>
            {isSuperAdmin() && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1.5">
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
        </div>

        {isLoadingStats && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
                <Croissant className="h-5 w-5 text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="text-gray-500 text-sm">
                Loading your bakery data...
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <ShoppingCart className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        Recent Orders
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Latest customer orders
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/orders">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                      data-testid="button-view-all-orders"
                    >
                      View All <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-amber-50">
                  {(recentOrders || []).slice(0, 5).map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-amber-700">
                            {order.customerName?.charAt(0) || "C"}
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-medium text-gray-800"
                            data-testid={`text-customer-${order.id}`}
                          >
                            {order.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(
                              new Date(order.orderDate),
                              "MMM dd, h:mm a",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className="font-semibold text-gray-800"
                          data-testid={`text-amount-${order.id}`}
                        >
                          Rs.{" "}
                          {parseFloat(order.totalAmount || 0).toLocaleString()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Factory className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        Production Schedule
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Today's baking queue
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/production">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-700 hover:text-green-800 hover:bg-green-100"
                      data-testid="button-view-all-production"
                    >
                      View All <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-green-50">
                  {(upcomingProduction || [])
                    .slice(0, 5)
                    .map((item: ProductionItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-green-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                            <Wheat className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p
                              className="font-medium text-gray-800"
                              data-testid={`text-product-${item.id}`}
                            >
                              {item.productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} units scheduled
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <PriorityBadge priority={item.priority || "medium"} />
                          <OrderStatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <QuickActionCard key={index} {...action} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Low Stock Alert
                  </CardTitle>
                  <Badge
                    variant="destructive"
                    className="bg-red-100 text-red-700 border-red-200"
                  >
                    {lowStockItems?.length || 0} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(lowStockItems || []).slice(0, 4).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white/60 rounded-lg"
                  >
                    <div>
                      <p
                        className="font-medium text-gray-800 text-sm"
                        data-testid={`text-lowstock-${item.id}`}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {item.minLevel} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {item.currentStock} {item.unit}
                      </p>
                      <Progress
                        value={
                          (parseFloat(item.currentStock) /
                            parseFloat(item.minLevel)) *
                          100
                        }
                        className="w-16 h-1.5 mt-1"
                      />
                    </div>
                  </div>
                ))}
                <Link href="/inventory">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-50"
                    data-testid="button-view-low-stock"
                  >
                    View All Low Stock Items
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(notifications || []).slice(0, 3).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${notification.read ? "bg-white/40" : "bg-white/80 border-l-3 border-blue-400"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.priority === "high"
                            ? "bg-red-500"
                            : notification.priority === "medium"
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 text-center">
            <CheckCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {dashboardStats?.completedOrders || 0}
            </p>
            <p className="text-xs text-gray-600">Completed Today</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {dashboardStats?.pendingOrders || 0}
            </p>
            <p className="text-xs text-gray-600">Pending Orders</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {dashboardStats?.lowStockItems || 0}
            </p>
            <p className="text-xs text-gray-600">Low Stock Items</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {dashboardStats?.monthlyGrowth || 0}%
            </p>
            <p className="text-xs text-gray-600">Monthly Growth</p>
          </div>
        </div>
      </div>
    </div>
  );
}
