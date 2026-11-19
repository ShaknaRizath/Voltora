import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL, assetUrl, authHeader } from "../config";
import { useToast } from "../components/Toast";
import { Select } from "../components/inputs";
import { Breadcrumbs, Field, ImagePicker, PageHeader, PageLoader, Spinner } from "../components/ui";

const STATUSES = ["Pending", "Rejected", "Approved", "In Progress", "Resolved"];

const Toggle = ({ name, checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 transition hover:bg-zinc-100/70">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
    />
    <span>
      <span className="block text-sm font-semibold text-zinc-900">{label}</span>
      <span className="block text-xs text-zinc-500">{hint}</span>
    </span>
  </label>
);

export default function EditRepair() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [repair, setRepair] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    repairedImage: null,
    isValid: false,
    isConfirmed: false,
  });

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/repairs/${id}`, { headers: authHeader() });
        setRepair(res.data);
        setFormData({
          status: res.data.status || "",
          repairedImage: null,
          isValid: res.data.isValid || false,
          isConfirmed: res.data.isConfirmed || false,
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load repair data");
      }
    };
    fetchRepair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append("status", formData.status);
      data.append("isValid", formData.isValid);
      data.append("isConfirmed", formData.isConfirmed);
      if (formData.repairedImage) data.append("repairedImage", formData.repairedImage);

      await axios.put(`${API_URL}/api/repairs/${id}/admin`, data, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });

      toast.success("Repair updated successfully!");
      navigate(`/repair/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!repair) return <PageLoader />;

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: "Repairs", to: "/repair" },
          { label: repair.repairId, to: `/repair/${id}` },
          { label: "Update status" },
        ]}
      />
      <PageHeader title={`Update ${repair.repairId}`} description="Admin only. Change the status and attach the repaired photo." />

      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" value={formData.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <ImagePicker
          label="Repaired image"
          file={formData.repairedImage}
          currentUrl={assetUrl(repair.repairedImage)}
          onChange={(file) => setFormData((f) => ({ ...f, repairedImage: file }))}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle name="isValid" checked={formData.isValid} onChange={handleChange} label="Valid" hint="Warranty / claim is valid" />
          <Toggle name="isConfirmed" checked={formData.isConfirmed} onChange={handleChange} label="Confirmed" hint="Customer confirmed the repair" />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate(`/repair/${id}`)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving && <Spinner className="h-4 w-4" />} {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
