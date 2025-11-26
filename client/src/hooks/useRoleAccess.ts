// src/hooks/useRoleAccess.ts
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import { getRouteModule, getResourceModule, SYSTEM_MODULES } from "../../../shared/modules";

/**
 * Hook to provide role-based access control (RBAC)
 * All functions are memoized by reference since they're static per-user
 */
export function useRoleAccess() {
  const { user } = useAuth(); // ✅ Always called unconditionally
  const { hasPermission } = usePermissions();

  // Fetch user's module access
  const { data: userModulesResponse } = useQuery({
    queryKey: ["user", "modules", user?.id, user?.role],
    queryFn: async () => {
      const response = await fetch("/api/user/modules");
      if (!response.ok) {
        throw new Error("Failed to fetch user modules");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for faster updates)
    refetchOnWindowFocus: true,
  });

  const userModuleIds = new Set(userModulesResponse?.data?.moduleIds || []);

  // Role checkers — safe even if user is null (returns false)
  const isSuperAdmin = () => user?.role === "super_admin";
  const isAdmin = () => user?.role === "admin";
  const isManager = () => user?.role === "manager";
  const isSupervisor = () => user?.role === "supervisor";
  const isMarketer = () => user?.role === "marketer";
  const isStaff = () => user?.role === "staff";

  /**
   * Check if current user can access a specific module
   */
  const canAccessModule = (moduleId: string): boolean => {
    if (!user) return false;

    // Super Admin has access to all modules
    if (isSuperAdmin()) {
      console.log(`🚀 Super Admin module access granted for: ${moduleId}`);
      return true;
    }

    // Check if user has access to this module
    const hasAccess = userModuleIds.has(moduleId);
    console.log(`🔐 Module access for ${moduleId}: ${hasAccess}`);
    return hasAccess;
  };

  /**
   * Check if current user can access a route based on module access
   */
  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;

    // Super Admin has access to all routes
    if (isSuperAdmin()) {
      console.log(`🚀 Super Admin route access granted for: ${route}`);
      return true;
    }

    // Find the module that contains this route
    const routeModule = getRouteModule(route);
    if (!routeModule) {
      console.log(`⚠️ No module found for route: ${route}`);
      return false; // If no module is found, deny access
    }

    // Check module access
    return canAccessModule(routeModule.id);
  };

  /**
   * Check if current user can access a page/resource
   */
  const canAccessPage = (
    resource: string,
    action: "read" | "write" | "read_write" = "read"
  ): boolean => {
    if (!user) return false;

    // Super Admin has UNLIMITED access to everything - no restrictions whatsoever
    if (isSuperAdmin()) {
      console.log(`🚀 Super Admin UNLIMITED access granted for: ${resource} (${action}) - NO RESTRICTIONS`);
      return true;
    }

    // First check module-based access
    const resourceModule = getResourceModule(resource);
    if (resourceModule && !canAccessModule(resourceModule.id)) {
      console.log(`❌ Module access denied for resource: ${resource} (module: ${resourceModule.id})`);
      return false;
    }

    // Admins can do almost everything except super_admin specific resources
    if (isAdmin()) {
      const restrictedResources = ["super_admin"];
      const hasAccess = !restrictedResources.includes(resource);
      console.log(`🔧 Admin access for ${resource}: ${hasAccess}`);
      return hasAccess;
    }

    // Manager-level access
    if (isManager()) {
      const allowedResources = [
        "dashboard",
        "products",
        "inventory",
        "orders",
        "production",
        "customers",
        "parties",
        "assets",
        "expenses",
        "sales",
        "purchases",
        "reports",
        "staff",
        "attendance",
        "salary",
        "leave_requests",
      ];
      const hasAccess = allowedResources.includes(resource);
      console.log(`👔 Manager access for ${resource}: ${hasAccess}`);
      return hasAccess;
    }

    // Supervisor access
    if (isSupervisor()) {
      const allowedResources = [
        "dashboard",
        "products",
        "inventory",
        "orders",
        "production",
        "customers",
        "staff",
        "attendance",
      ];
      const hasAccess = allowedResources.includes(resource);
      console.log(`👷 Supervisor access for ${resource}: ${hasAccess}`);
      return hasAccess;
    }

    // Marketer access
    if (isMarketer()) {
      const allowedResources = [
        "dashboard",
        "products",
        "customers",
        "orders",
        "sales",
        "reports",
      ];
      const hasAccess = allowedResources.includes(resource);
      console.log(`📈 Marketer access for ${resource}: ${hasAccess}`);
      return hasAccess;
    }

    // Staff access
    if (isStaff()) {
      const allowedResources = [
        "dashboard",
        "products",
        "inventory",
        "orders",
        "production",
      ];
      const hasAccess = allowedResources.includes(resource);
      console.log(`👨‍💼 Staff access for ${resource}: ${hasAccess}`);
      return hasAccess;
    }

    // Fallback to fine-grained permissions system (if any)
    console.log(`❌ No access for ${resource} - checking permissions`);
    return hasPermission(resource, action);
  };

  // Enhanced sidebar item access that considers module access
  const canAccessSidebarItem = (resource: string, action: "read" | "write" | "read_write" = "read"): boolean => {
    if (!user) return false;

    // Super Admin has access to everything
    if (isSuperAdmin()) {
      return true;
    }

    // Check module access first
    const resourceModule = getResourceModule(resource);
    if (resourceModule && !canAccessModule(resourceModule.id)) {
      return false;
    }

    // Then check traditional page access
    return canAccessPage(resource, action);
  };

  // High-level capability checks - Super Admin has ALL capabilities
  const canManageUsers = (): boolean => isSuperAdmin() || isAdmin();
  const canViewSuperAdminUsers = (): boolean => isSuperAdmin();
  const canManageStaff = (): boolean => isSuperAdmin() || isAdmin() || isManager();
  const canViewFinance = (): boolean => isSuperAdmin() || isAdmin() || isManager();
  const canManageSettings = (): boolean => isSuperAdmin() || isAdmin();
  const canManageBranches = (): boolean => isSuperAdmin() || isAdmin();
  const canAccessAuditLogs = (): boolean => isSuperAdmin() || isAdmin();
  const canViewSystemLogs = (): boolean => isSuperAdmin();
  const canAccessDeveloperTools = (): boolean => isSuperAdmin();
  const canBypassAllRestrictions = (): boolean => {
    const bypass = isSuperAdmin();
    if (bypass) {
      console.log('🚀 Super Admin: ALL RESTRICTIONS BYPASSED');
    }
    return bypass;
  };
  const canExportAllData = (): boolean => isSuperAdmin() || isAdmin();
  const canModifySystemConfig = (): boolean => isSuperAdmin();
  const canAccessAllReports = (): boolean => isSuperAdmin() || isAdmin() || isManager();

  // Branch access logic - Super Admin bypasses all branch restrictions
  const canAccessAllBranches = (): boolean =>
    isSuperAdmin() || user?.canAccessAllBranches === true;

  const getUserBranchId = (): number | undefined => 
    isSuperAdmin() ? undefined : user?.branchId ?? undefined;

  const canAccessBranchData = (branchId?: number): boolean => {
    if (isSuperAdmin()) return true; // Super Admin can access ALL branch data
    if (!branchId) return true;
    if (canAccessAllBranches()) return true;
    return getUserBranchId() === branchId;
  };

  const getBranchDisplayName = (): string => {
    if (canAccessAllBranches()) return "All Branches";
    return `Branch ${user?.branchId || 'Unknown'}`;
  };

  const getBranchFilterForUser = () => ({
    userBranchId: getUserBranchId(),
    canAccessAllBranches: canAccessAllBranches(),
  });

  const getRoleDisplayName = (): string => {
    switch (user?.role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "supervisor":
        return "Supervisor";
      case "marketer":
        return "Marketer";
      case "staff":
        return "Staff";
      default:
        return "Unknown Role";
    }
  };

  return {
    // Role checkers
    isSuperAdmin,
    isAdmin,
    isManager,
    isSupervisor,
    isMarketer,
    isStaff,

    // Access control
    canAccessPage,
    canAccessSidebarItem,
    canAccessRoute,
    canAccessModule,

    // Module data
    userModuleIds: Array.from(userModuleIds),
    userModulesLoading: !userModulesResponse && !!user,

    // Capabilities
    canManageUsers,
    canViewSuperAdminUsers,
    canManageStaff,
    canViewFinance,
    canManageSettings,
    canManageBranches,
    canAccessAllBranches,
    canAccessAuditLogs,
    canViewSystemLogs,
    canAccessDeveloperTools,
    canBypassAllRestrictions,
    canExportAllData,
    canModifySystemConfig,
    canAccessAllReports,

    // Branch utilities
    getUserBranchId,
    canAccessBranchData,
    getBranchDisplayName,
    getBranchFilterForUser,

    // Display helpers
    getRoleDisplayName,

    // Raw user object (for advanced usage)
    user,
  };
}