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
      try {
        console.log('Fetching units from API...');
        const response = await apiRequest("GET", "/api/units");
        console.log('Units API response:', response);
        
        // Handle the consistent API response format
        if (response?.success && Array.isArray(response.data)) {
          console.log('Units extracted from response.data:', response.data);
          return response.data as Unit[];
        }
        
        // Fallback for legacy response format
        if (Array.isArray(response)) {
          console.log('Units in legacy array format:', response);
          return response as Unit[];
        }
        
        console.warn('Unexpected units response format:', response);
        return [];
      } catch (error) {
        console.error('Error fetching units:', error);
        throw error; // Re-throw to let React Query handle it
      }
    },
    staleTime: 5 * 60 * 1000,
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