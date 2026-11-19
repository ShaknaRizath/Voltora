import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL, authHeader } from "../config";
import { useToast } from "../components/Toast";
import { Breadcrumbs, Field, ImagePicker, PageHeader, Spinner } from "../components/ui";

export default function AddRepair() {
  const [formData, setFormData] = useState({
    productId: "",
    customerName: "",
    productName: "",
    description: "",
    damagedImage: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.productId.startsWith("R00")) {
      toast.error("Product ID must start with 'R00'");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("productId", formData.productId);
      form.append("customerName", formData.customerName);
      form.append("productName", formData.productName);
      form.append("description", formData.description);
      if (formData.damagedImage) form.append("damagedImage", formData.damagedImage);

      await axios.post(`${API_URL}/api/repairs`, form, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });

      toast.success("Repair submitted successfully!");
      navigate("/repair");
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Repairs", to: "/repair" }, { label: "New request" }]} />
      <PageHeader title="Submit a repair request" description="Tell us what's wrong and attach a photo of the damage." />

      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Product ID" htmlFor="productId" hint="Must start with R00, e.g. R001">
            <input id="productId" name="productId" value={formData.productId} onChange={handleChange} placeholder="R001" required className="input" />
          </Field>
          <Field label="Customer name" htmlFor="customerName">
            <input id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Jane Doe" required className="input" />
          </Field>
        </div>
        <Field label="Product name" htmlFor="productName">
          <input id="productName" name="productName" value={formData.productName} onChange={handleChange} placeholder="e.g. iPhone 14 Pro Max" required className="input" />
        </Field>
        <Field label="Description of the problem" htmlFor="description">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
            placeholder="Describe the damage or issue…"
            className="input resize-none"
          />
        </Field>

        <ImagePicker
          label="Photo of the damage"
          file={formData.damagedImage}
          required
          onChange={(file) => setFormData((f) => ({ ...f, damagedImage: file }))}
        />

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/repair")} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting && <Spinner className="h-4 w-4" />} {submitting ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}
