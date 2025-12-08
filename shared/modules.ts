
// System modules for role-based access control
export interface SystemModule {
  id: string;
  name: string;
  description: string;
  category: string;
  routes: string[];
  resources: string[];
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Main dashboard and overview",
    category: "core",
    routes: ["/", "/dashboard"],
    resources: ["dashboard"]
  },
  {
    id: "sales_management",
    name: "Sales Management",
    description: "Sales, orders, and customer transactions",
    category: "finance",
    routes: ["/sales", "/orders", "/day-book", "/transactions"],
    resources: ["sales", "orders"]
  },
  {
    id: "inventory_management",
    name: "Inventory Management",
    description: "Stock, products, and inventory control",
    category: "inventory",
    routes: ["/inventory", "/stock", "/products", "/ingredients"],
    resources: ["inventory", "products"]
  },
  {
    id: "purchase_management",
    name: "Purchase Management",
    description: "Purchases and supplier management",
    category: "finance",
    routes: ["/purchases", "/purchase-returns"],
    resources: ["purchases"]
  },
  {
    id: "customer_management",
    name: "Customer Management",
    description: "Customer and party management",
    category: "crm",
    routes: ["/customers", "/parties"],
    resources: ["customers", "parties"]
  },
  {
    id: "production_management",
    name: "Production Management",
    description: "Production scheduling and manufacturing",
    category: "operations",
    routes: ["/production", "/recipes", "/label-printing"],
    resources: ["production"]
  },
  {
    id: "hr_management",
    name: "HR & Payroll",
    description: "Staff, attendance, and payroll management",
    category: "hr",
    routes: ["/staff", "/attendance", "/salary", "/leave-requests", "/staff-schedules"],
    resources: ["staff", "attendance", "salary", "leave_requests"]
  },
  {
    id: "financial_management",
    name: "Financial Management",
    description: "Expenses, assets, and financial tracking",
    category: "finance",
    routes: ["/expenses", "/assets", "/sales-returns"],
    resources: ["expenses", "assets", "sales_returns"]
  },
  {
    id: "reports_analytics",
    name: "Reports & Analytics",
    description: "Business reports and analytics",
    category: "analytics",
    routes: ["/reports"],
    resources: ["reports"]
  },
  {
    id: "user_management",
    name: "User Management",
    description: "User accounts and permissions",
    category: "administration",
    routes: ["/admin/users", "/admin/roles"],
    resources: ["users", "roles"]
  },
  {
    id: "audit_management",
    name: "Audit & Security",
    description: "Audit logs and security monitoring",
    category: "administration",
    routes: ["/admin/login-logs", "/admin/audit-logs"],
    resources: ["audit", "security"]
  },
  {
    id: "system_configuration",
    name: "System Configuration",
    description: "System settings and configuration",
    category: "administration",
    routes: ["/settings", "/units"],
    resources: ["settings", "system"]
  },
  {
    id: "branch_management",
    name: "Branch Management",
    description: "Multi-branch operations",
    category: "administration",
    routes: ["/branches"],
    resources: ["branches"]
  }
];

// Helper functions to find modules by route or resource
export function getRouteModule(route: string): SystemModule | undefined {
  return SYSTEM_MODULES.find(module => 
    module.routes.some(moduleRoute => 
      route === moduleRoute || route.startsWith(moduleRoute + "/")
    )
  );
}

export function getResourceModule(resource: string): SystemModule | undefined {
  return SYSTEM_MODULES.find(module => 
    module.resources.includes(resource)
  );
}

export function getModulesByCategory(category: string): SystemModule[] {
  return SYSTEM_MODULES.filter(module => module.category === category);
}

export function getAllModuleIds(): string[] {
  return SYSTEM_MODULES.map(module => module.id);
}
