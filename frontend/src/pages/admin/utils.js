// Non-component helpers for the admin tabs.
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL, authHeader } from "../../config";
import { useToast } from "../../components/Toast";

export const shortId = (id) => `#${String(id).slice(-6).toUpperCase()}`;

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "N/A";

/** GET helper with loading state and a reload function. */
export function useFetch(path, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}${path}`, { headers: authHeader(), params: JSON.parse(key) });
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't load data");
    } finally {
      setLoading(false);
    }
  }, [path, key, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, reload: load };
}
