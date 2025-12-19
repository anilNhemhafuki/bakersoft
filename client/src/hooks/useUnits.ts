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

      // The API returns array directly
      if (Array.isArray(response)) {
        console.log(`✅ useUnits - Loaded ${response.length} units`);
        return response as Unit[];
      }

      // Fallback: check if response has a data property
      if (response && typeof response === "object" && "data" in response) {
        const data = (response as any).data;
        if (Array.isArray(data)) {
          console.log(`✅ useUnits - Loaded ${data.length} units from response.data`);
          return data as Unit[];
        }
      }

      // If we get here, the response format is unexpected
      console.warn("⚠️ useUnits - Unexpected response format:", response);
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