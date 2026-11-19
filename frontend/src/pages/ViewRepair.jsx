import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiCheckCircle, FiEdit2, FiXCircle } from "react-icons/fi";
import { API_URL, assetUrl, authHeader } from "../config";
import { useToast } from "../components/Toast";
import { Breadcrumbs, EmptyState, Modal, PageLoader, StatusBadge } from "../components/ui";

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-3 text-sm">
    <dt className="text-zinc-500">{label}</dt>
    <dd className="text-right font-medium text-zinc-900">{children || "N/A"}</dd>
  </div>
);

const Flag = ({ value }) =>
  value ? (
    <span className="inline-flex items-center gap-1 text-zinc-900">
      <FiCheckCircle /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-zinc-400">
      <FiXCircle /> No
    </span>
  );

// Click the photo (or the caption) to open it full size.
const ImageCard = ({ label, path, onOpen }) => (
  <figure className="overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-200">
    <div className="aspect-[4/3] bg-zinc-100">
      {path ? (
        <button
          type="button"
          onClick={() => onOpen({ label, src: assetUrl(path) })}
          aria-label={`View ${label} photo full size`}
          className="block h-full w-full cursor-zoom-in"
        >
          <img src={assetUrl(path)} alt={label} className="h-full w-full object-cover" />
        </button>
      ) : (
        <div className="grid h-full place-items-center text-sm text-zinc-400">Not available yet</div>
      )}
    </div>
    <figcaption className="px-4 py-3 text-sm font-semibold text-zinc-800">{label}</figcaption>
  </figure>
);

export default function ViewRepair() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null); // { label, src }

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/repairs/${id}`, { headers: authHeader() });
        setRepair(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load repair details");
      } finally {
        setLoading(false);
      }
    };
    fetchRepair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <PageLoader label="Loading repair details…" />;

  if (!repair)
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={FiAlertTriangle}
          title="Repair not found"
          description="We couldn't load this repair. You may need to sign in first."
          action={
            <Link to="/repair" className="btn btn-primary">
              Back to repairs
            </Link>
          }
        />
      </div>
    );

  const fmt = (d) => (d ? new Date(d).toLocaleString() : "");

  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Repairs", to: "/repair" }, { label: repair.repairId }]} />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{repair.productName}</h1>
          <StatusBadge status={repair.status} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/repair/${id}/edit-basic`)} className="btn btn-secondary">
            <FiEdit2 /> Edit details
          </button>
          <button onClick={() => navigate("/repair")} className="btn btn-ghost">
            Back
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          <ImageCard label="Before (damaged)" path={repair.damagedImage} onOpen={setPreview} />
          <ImageCard label="After (repaired)" path={repair.repairedImage} onOpen={setPreview} />
          <div className="card p-5 sm:col-span-2">
            <h2 className="text-sm font-semibold text-zinc-500">Problem description</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-800">{repair.description || "No description provided"}</p>
          </div>
        </section>

        <aside className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Details</h2>
            <dl className="mt-3 divide-y divide-zinc-100">
              <Row label="Repair ID">
                <span className="font-mono">{repair.repairId}</span>
              </Row>
              <Row label="Product ID">
                <span className="font-mono">{repair.productId}</span>
              </Row>
              <Row label="Customer">{repair.customerName}</Row>
              <Row label="Validated">
                <Flag value={repair.isValid} />
              </Row>
              <Row label="Confirmed">
                <Flag value={repair.isConfirmed} />
              </Row>
              <Row label="Submitted">{fmt(repair.submittedAt || repair.createdAt)}</Row>
              {repair.updatedAt && <Row label="Last updated">{fmt(repair.updatedAt)}</Row>}
            </dl>
          </div>
        </aside>
      </div>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="max-w-5xl" label={preview?.label}>
        {preview && (
          <figure className="bg-zinc-950">
            <img src={preview.src} alt={preview.label} className="mx-auto max-h-[80vh] w-full object-contain" />
            <figcaption className="flex items-center justify-between gap-4 bg-white px-5 py-3 text-sm">
              <span className="font-semibold text-zinc-800">
                {repair.repairId} · {preview.label}
              </span>
              <a href={preview.src} target="_blank" rel="noreferrer" className="font-medium text-zinc-600 transition hover:text-zinc-900">
                Open original
              </a>
            </figcaption>
          </figure>
        )}
      </Modal>
    </div>
  );
}
