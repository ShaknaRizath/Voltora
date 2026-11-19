import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle } from "react-icons/fi";
import { API_URL, assetUrl, authHeader } from "../config";
import { useToast } from "../components/Toast";
import { Breadcrumbs, EmptyState, Field, ImagePicker, PageHeader, PageLoader, Spinner } from "../components/ui";

export default function EditRepairBasic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [description, setDescription] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [damagedImage, setDamagedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/repairs/${id}`, { headers: authHeader() });
        setDescription(res.data.description);
        setCurrentImage(assetUrl(res.data.damagedImage));
      } catch (err) {
        console.error("Fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRepair();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append("description", description);
    if (damagedImage) formData.append("damagedImage", damagedImage);

    try {
      await axios.put(`${API_URL}/api/repairs/${id}`, formData, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      toast.success("Repair updated successfully!");
      navigate("/repair");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading repair…" />;

  if (error)
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={FiAlertTriangle}
          title="Failed to load repair"
          description="Please sign in and try again."
          action={
            <Link to="/repair" className="btn btn-primary">
              Back to repairs
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Repairs", to: "/repair" }, { label: "Edit request" }]} />
      <PageHeader title="Edit your request" description="Update the description or replace the damaged photo." />

      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Update description"
            className="input resize-none"
          />
        </Field>

        <ImagePicker label="Damaged photo" file={damagedImage} currentUrl={currentImage} onChange={setDamagedImage} />

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/repair")} className="btn btn-secondary">
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
