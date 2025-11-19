
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import { 
  Users, 
  Shield, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info
} from "lucide-react";
import { SYSTEM_MODULES, getModulesByCategory, type ModuleDefinition } from "../../../shared/modules";

interface RoleModule {
  id: number;
  role: string;
  moduleId: string;
  granted: boolean;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Administrator", description: "Full system access except super admin features" },
  { value: "manager", label: "Manager", description: "Departmental management and reporting access" },
  { value: "supervisor", label: "Supervisor", description: "Team supervision and operational oversight" },
  { value: "marketer", label: "Marketer", description: "Sales, customer management, and marketing tools" },
  { value: "staff", label: "Staff", description: "Basic operational access for daily tasks" },
];

export default function AdminRoles() {
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch role modules
  const { data: roleModulesResponse, isLoading: roleModulesLoading, error: roleModulesError } = useQuery({
    queryKey: ["admin", "role-modules"],
    queryFn: async () => {
      const response = await fetch("/api/admin/role-modules");
      if (!response.ok) {
        throw new Error("Failed to fetch role modules");
      }
      return response.json();
    },
  });

  // Fetch modules for specific role
  const { data: currentRoleModulesResponse, isLoading: currentRoleLoading } = useQuery({
    queryKey: ["admin", "role-modules", selectedRole],
    queryFn: async () => {
      const response = await fetch(`/api/admin/role-modules/${selectedRole}`);
      if (!response.ok) {
        throw new Error("Failed to fetch role modules");
      }
      return response.json();
    },
    enabled: !!selectedRole,
  });

  // Update role modules mutation
  const updateRoleModulesMutation = useMutation({
    mutationFn: async ({ role, moduleIds }: { role: string; moduleIds: string[] }) => {
      const response = await fetch("/api/admin/role-modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, moduleIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update role modules");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "role-modules"] });
      toast({
        title: "Role Updated",
        description: `Successfully updated modules for ${data.data.role}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update role modules",
        variant: "destructive",
      });
    },
  });

  // Update selected modules when role changes
  React.useEffect(() => {
    if (currentRoleModulesResponse?.success && currentRoleModulesResponse.data) {
      const grantedModules = currentRoleModulesResponse.data
        .filter((rm: RoleModule) => rm.granted)
        .map((rm: RoleModule) => rm.moduleId);
      setSelectedModules(new Set(grantedModules));
    }
  }, [currentRoleModulesResponse]);

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const newSelected = new Set(selectedModules);
    if (checked) {
      newSelected.add(moduleId);
    } else {
      newSelected.delete(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const handleCategoryToggle = (category: ModuleDefinition['category'], checked: boolean) => {
    const categoryModules = getModulesByCategory(category);
    const newSelected = new Set(selectedModules);
    
    categoryModules.forEach(module => {
      // Skip super admin only modules for non-super-admin roles
      if (module.requiredRole === 'super_admin' && selectedRole !== 'super_admin') {
        return;
      }
      
      if (checked) {
        newSelected.add(module.id);
      } else {
        newSelected.delete(module.id);
      }
    });
    
    setSelectedModules(newSelected);
  };

  const handleSaveRoleModules = () => {
    const moduleIds = Array.from(selectedModules);
    updateRoleModulesMutation.mutate({ role: selectedRole, moduleIds });
  };

  const getCategoryModules = (category: ModuleDefinition['category']) => {
    return getModulesByCategory(category).filter(module => {
      // Hide super admin only modules for non-super-admin roles
      if (module.requiredRole === 'super_admin' && selectedRole !== 'super_admin') {
        return false;
      }
      return true;
    });
  };

  const isCategoryFullySelected = (category: ModuleDefinition['category']) => {
    const categoryModules = getCategoryModules(category);
    return categoryModules.length > 0 && categoryModules.every(module => selectedModules.has(module.id));
  };

  const isCategoryPartiallySelected = (category: ModuleDefinition['category']) => {
    const categoryModules = getCategoryModules(category);
    return categoryModules.some(module => selectedModules.has(module.id)) && !isCategoryFullySelected(category);
  };

  const getModuleStats = () => {
    const totalAvailable = SYSTEM_MODULES.filter(module => {
      if (module.requiredRole === 'super_admin' && selectedRole !== 'super_admin') {
        return false;
      }
      return true;
    }).length;
    
    const selected = selectedModules.size;
    return { selected, totalAvailable };
  };

  const categories: { id: ModuleDefinition['category']; name: string; icon: React.ReactNode; description: string }[] = [
    { id: 'core', name: 'Core System', icon: <Shield className="h-4 w-4" />, description: 'Essential system features' },
    { id: 'finance', name: 'Financial Management', icon: <Users className="h-4 w-4" />, description: 'Sales, purchases, expenses' },
    { id: 'inventory', name: 'Inventory & Production', icon: <Settings className="h-4 w-4" />, description: 'Stock and manufacturing' },
    { id: 'crm', name: 'Customer Relations', icon: <Users className="h-4 w-4" />, description: 'Customer and supplier management' },
    { id: 'hr', name: 'Human Resources', icon: <Users className="h-4 w-4" />, description: 'Staff and payroll management' },
    { id: 'reports', name: 'Reports & Analytics', icon: <Settings className="h-4 w-4" />, description: 'Business intelligence' },
    { id: 'admin', name: 'Administration', icon: <Shield className="h-4 w-4" />, description: 'System administration' },
    ...(selectedRole === 'super_admin' ? [
      { id: 'developer' as const, name: 'Developer Tools', icon: <Settings className="h-4 w-4" />, description: 'Development utilities' },
      { id: 'security' as const, name: 'Security & Monitoring', icon: <Shield className="h-4 w-4" />, description: 'Advanced security features' }
    ] : [])
  ];

  if (roleModulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading role modules...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute resource="users" action="read_write">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">
              Configure module access permissions for user roles
            </p>
          </div>
        </div>

        {roleModulesError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load role modules: {roleModulesError.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Module Assignment
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Role Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Module Assignment</CardTitle>
                    <CardDescription>
                      Select which modules each role can access
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedRole && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="font-medium">
                          {AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {AVAILABLE_ROLES.find(r => r.value === selectedRole)?.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {getModuleStats().selected} / {getModuleStats().totalAvailable}
                        </div>
                        <p className="text-sm text-muted-foreground">Modules assigned</p>
                      </div>
                    </div>

                    {selectedRole === 'super_admin' && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Super Admin role has automatic access to all system modules and cannot be modified.
                        </AlertDescription>
                      </Alert>
                    )}

                    {currentRoleLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading current permissions...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {categories.map((category) => {
                          const categoryModules = getCategoryModules(category.id);
                          if (categoryModules.length === 0) return null;

                          const isFullySelected = isCategoryFullySelected(category.id);
                          const isPartiallySelected = isCategoryPartiallySelected(category.id);

                          return (
                            <div key={category.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`category-${category.id}`}
                                    checked={isFullySelected}
                                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                                    disabled={selectedRole === 'super_admin'}
                                    className={isPartiallySelected ? "data-[state=checked]:bg-orange-600" : ""}
                                  />
                                  <div className="flex items-center space-x-2">
                                    {category.icon}
                                    <div>
                                      <h4 className="font-medium">{category.name}</h4>
                                      <p className="text-sm text-muted-foreground">{category.description}</p>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant={isFullySelected ? "default" : isPartiallySelected ? "secondary" : "outline"}>
                                  {categoryModules.filter(m => selectedModules.has(m.id)).length} / {categoryModules.length}
                                </Badge>
                              </div>
                              
                              <div className="ml-6 space-y-2">
                                {categoryModules.map((module) => (
                                  <div key={module.id} className="flex items-center space-x-3 py-2">
                                    <Checkbox
                                      id={`module-${module.id}`}
                                      checked={selectedModules.has(module.id)}
                                      onCheckedChange={(checked) => handleModuleToggle(module.id, checked as boolean)}
                                      disabled={selectedRole === 'super_admin'}
                                    />
                                    <div className="flex-1">
                                      <label
                                        htmlFor={`module-${module.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {module.name}
                                      </label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {module.description}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {module.routes.map((route, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {route}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Separator />
                            </div>
                          );
                        })}

                        {selectedRole !== 'super_admin' && (
                          <div className="flex items-center justify-end space-x-3 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (currentRoleModulesResponse?.success && currentRoleModulesResponse.data) {
                                  const grantedModules = currentRoleModulesResponse.data
                                    .filter((rm: RoleModule) => rm.granted)
                                    .map((rm: RoleModule) => rm.moduleId);
                                  setSelectedModules(new Set(grantedModules));
                                }
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reset Changes
                            </Button>
                            <Button
                              onClick={handleSaveRoleModules}
                              disabled={updateRoleModulesMutation.isPending}
                            >
                              {updateRoleModulesMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4">
              {AVAILABLE_ROLES.map((role) => (
                <Card key={role.value}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {role.label}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {roleModulesResponse?.data?.filter((rm: RoleModule) => rm.role === role.value && rm.granted).length || 0} modules
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {roleModulesResponse?.data
                        ?.filter((rm: RoleModule) => rm.role === role.value && rm.granted)
                        .map((rm: RoleModule) => {
                          const module = SYSTEM_MODULES.find(m => m.id === rm.moduleId);
                          return module ? (
                            <Badge key={rm.moduleId} variant="secondary">
                              {module.name}
                            </Badge>
                          ) : null;
                        })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
