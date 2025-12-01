import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Unit {
  id: number;
  name: string;
  abbreviation: string;
  type: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const useUnits = () => {
  return useQuery({
    queryKey: ["/api/units"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/units");
      console.log("useUnits - Raw response:", response);
      console.log("useUnits - Response type:", typeof response);
      console.log("useUnits - Is array:", Array.isArray(response));
      
      // The API returns array directly
      if (Array.isArray(response)) {
        console.log("useUnits - Returning units array:", response);
        return response as Unit[];
      }
      
      // Handle wrapped response format
      if (response?.data && Array.isArray(response.data)) {
        console.log("useUnits - Returning units from response.data:", response.data);
        return response.data as Unit[];
      }
      
      // Handle success property format
      if (response?.success && Array.isArray(response?.units)) {
        console.log("useUnits - Returning units from response.units:", response.units);
        return response.units as Unit[];
      }
      
      console.warn("useUnits - Unexpected response format:", response);
      console.warn("useUnits - Returning empty array");
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });
};

// Active units filter hook
export const useActiveUnits = () => {
  const { data: units = [], ...rest } = useUnits();

  // Ensure units is always an array before filtering
  const safeUnits = Array.isArray(units) ? units : [];
  const activeUnits = safeUnits.filter((unit: Unit) => unit.isActive !== false);

  return {
    data: activeUnits,
    ...rest,
  };
};

// Get unit by ID helper
export const useUnitById = (unitId: number | string | undefined) => {
  const { data: units = [] } = useUnits();

  if (!unitId) return null;

  return units.find((unit: Unit) => 
    unit.id.toString() === unitId.toString()
  ) || null;
};

// Get units by type helper
export const useUnitsByType = (type: string) => {
  const { data: units = [], ...rest } = useUnits();

  const filteredUnits = units.filter((unit: Unit) => 
    unit.type === type && unit.isActive !== false
  );

  return {
    data: filteredUnits,
    ...rest,
  };
};