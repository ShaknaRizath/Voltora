import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiImage } from "react-icons/fi";
import { API_URL, assetUrl } from "../config";
import { useToast } from "../components/Toast";
import { Breadcrumbs, EmptyState, PageHeader, PageLoader, StatusBadge } from "../components/ui";

const Photo = ({ label, path }) => (
  <figure>
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
      {path ? (
        <img src={assetUrl(path)} alt={label} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-zinc-400">Awaiting repair</div>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-zinc-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
        {label}
      </span>
    </div>
  </figure>
);

export default function ViewRepairImages() {
  const toast = useToast();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        // Public and anonymous: no customer names or descriptions are ever returned.
        const res = await axios.get(`${API_URL}/api/repairs/gallery`);
        setRepairs(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load repair images");
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <PageLoader label="Loading gallery…" />;

  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Repairs", to: "/repair" }, { label: "Before & after" }]} />
      <PageHeader
        eyebrow="Transparency"
        title="Before & after gallery"
        description="See the condition of devices when they arrived and after our technicians finished. Customer details are never shown."
      />

      {repairs.length === 0 ? (
        <EmptyState icon={FiImage} title="No repairs to show yet" description="Repairs with an after photo will appear here." />
      ) : (
        <div className="space-y-6">
          {repairs.map((repair) => (
            <article key={repair._id} className="card p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-zinc-500">{repair.repairId}</p>
                  <h2 className="mt-1 text-lg font-semibold">{repair.productName}</h2>
                </div>
                <StatusBadge status={repair.status} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Photo label="Before" path={repair.damagedImage} />
                <Photo label="After" path={repair.repairedImage} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
