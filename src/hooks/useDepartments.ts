import { useState, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";

export type Department = {
  id: string;
  client_id: string;
  name: string;
  status: string | null;
  archived_at: string | null;
  description?: string | null;
  department_code?: string | null;
  contact_person?: string | null;
  contact_number?: string | null;
  department_head?: string | null;
  office_name?: string | null;
  location?: string | null;
  floor?: string | null;
  abbreviation?: string | null;
  budget?: number | null;
  created_at: string;
  updated_at: string;
  locations?: Array<{
    id: string;
    name: string;
    [key: string]: any;
  }>;
};

export function useDepartments(clientId: string) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("departments")
      .select(`
        *,
        locations:departments_location(*)
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setDepartments(data || []);
    setLoading(false);
  }, [clientId]);

  const createDepartment = async (values: Partial<Department>) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("departments").insert([{ ...values, client_id: clientId, name: values.name || '' }]);
    if (error) setError(error.message);
    await fetchDepartments();
    setLoading(false);
  };

  const updateDepartment = async (id: string, values: Partial<Department>) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("departments").update(values).eq("id", id);
    if (error) setError(error.message);
    await fetchDepartments();
    setLoading(false);
  };

  const archiveDepartment = async (id: string) => {
    await updateDepartment(id, { archived_at: new Date().toISOString() });
  };

  const restoreDepartment = async (id: string) => {
    await updateDepartment(id, { archived_at: null });
  };

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    archiveDepartment,
    restoreDepartment,
  };
}

export function useDepartmentLocations(departmentId: string) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("departments_location")
      .select("*")
      .eq("department_id", departmentId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setLocations(data || []);
    setLoading(false);
  }, [departmentId]);

  return { locations, loading, error, fetchLocations };
}