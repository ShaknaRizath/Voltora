import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload, FiEdit2, FiEye, FiImage, FiPlus, FiSearch, FiSettings, FiTool, FiTrash2 } from "react-icons/fi";
import useAuth from "../hooks/useAuth";
import { API_URL, authHeader, getRole } from "../config";
import { useToast } from "../components/Toast";
import { Select } from "../components/inputs";
import { ConfirmDialog, EmptyState, PageHeader, Spinner, StatusBadge } from "../components/ui";

const STATUSES = ["Pending", "Approved", "In Progress", "Resolved", "Rejected"];

export default function RepairDashboard() {
  const [repairs, setRepairs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = useAuth();
  const isAdmin = getRole() === "admin";
  const toast = useToast();

  const fetchRepairs = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = { repairId: searchTerm, status, customerName, productName, sortBy, order };
      const res = await axios.get(`${API_URL}/api/repairs`, { params, headers: authHeader() });
      setRepairs(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) setSessionExpired(true);
      else toast.error("Failed to load repairs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, order, status]);

  const handleSearchKey = (e) => {
    if (e.key === "Enter") fetchRepairs();
  };

  const handleAddClick = () => {
    if (isLoggedIn) navigate("/repair/new");
    else navigate("/logins", { state: { redirectTo: "/repair/new" } });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/repairs/${toDelete._id}`, { headers: authHeader() });
      toast.success("Repair deleted successfully");
      setRepairs((prev) => prev.filter((r) => r._id !== toDelete._id));
      setToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const timestamp = new Date().toLocaleString();

    pdf.setFontSize(18);
    pdf.setTextColor("#333");
    pdf.text("Voltora Repair Records", pageWidth / 2, 20, { align: "center" });

    autoTable(pdf, {
      startY: 30,
      head: [["Repair ID", "Customer", "Product", "Description", "Status", "Submitted"]],
      body: repairs.map((r) => [
        r.repairId,
        r.customerName,
        r.productName,
        r.description || "N/A",
        r.status,
        new Date(r.createdAt).toLocaleDateString(),
      ]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 10, right: 10 },
    });

    pdf.setFontSize(10);
    pdf.setTextColor("#666");
    pdf.text(`Generated on: ${timestamp}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: "center" });
    pdf.save("repair-records.pdf");
  };

  const signIn = () => navigate("/logins", { state: { redirectTo: "/repair" } });

  // Repair requests are private: customers only ever see their own.
  if (!isLoggedIn || sessionExpired) {
    return (
      <div className="container-page py-8 sm:py-12">
        <PageHeader
          eyebrow="Services"
          title="Repair centre"
          description="Submit a repair request and follow every step from diagnosis to pickup."
          actions={
            <button onClick={() => navigate("/view-repair-images")} className="btn btn-secondary">
              <FiImage /> Before &amp; after
            </button>
          }
        />
        <EmptyState
          icon={FiTool}
          title={sessionExpired ? "Your session has expired" : "Sign in to manage your repairs"}
          description="Your repair requests are private. Sign in to submit a new one or follow the progress of an existing request."
          action={
            <button onClick={signIn} className="btn btn-primary">
              Sign in
            </button>
          }
        />
      </div>
    );
  }

  const iconBtn =
    "grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900";

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Services"
        title="Repair centre"
        description="Submit a repair request and follow every step from diagnosis to pickup."
        actions={
          <>
            <button onClick={() => navigate("/view-repair-images")} className="btn btn-secondary">
              <FiImage /> Before &amp; after
            </button>
            <button onClick={handleDownloadPDF} disabled={repairs.length === 0} className="btn btn-secondary">
              <FiDownload /> PDF
            </button>
            <button onClick={handleAddClick} className="btn btn-primary">
              <FiPlus /> New repair
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              placeholder="Repair ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKey}
              className="input !pl-10"
            />
          </div>
          <input
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={handleSearchKey}
            className="input"
          />
          <input
            placeholder="Product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={handleSearchKey}
            className="input"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-44">
            <option value="submittedAt">Sort by date</option>
            <option value="status">Sort by status</option>
          </Select>
          <Select value={order} onChange={(e) => setOrder(e.target.value)} className="w-44">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
          <button onClick={fetchRepairs} className="btn btn-brand ml-auto">
            <FiSearch /> Search
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid place-items-center py-24 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : repairs.length === 0 ? (
        <EmptyState
          icon={FiTool}
          title="No repairs found"
          description="Try adjusting your filters, or submit a new repair request."
          action={
            <button onClick={handleAddClick} className="btn btn-primary">
              <FiPlus /> New repair
            </button>
          }
        />
      ) : (
        <>
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5">Repair</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {repairs.map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => navigate(`/repair/${r._id}`)}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget === e.target && navigate(`/repair/${r._id}`)}
                    tabIndex={0}
                    aria-label={`Open repair ${r.repairId}`}
                    className="cursor-pointer transition hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-800">{r.repairId}</td>
                    <td className="px-6 py-4">{r.customerName}</td>
                    <td className="px-6 py-4 text-zinc-600">{r.productName}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button className={iconBtn} title="View" onClick={() => navigate(`/repair/${r._id}`)}>
                          <FiEye />
                        </button>
                        <button className={iconBtn} title="Edit description & image" onClick={() => navigate(`/repair/${r._id}/edit-basic`)}>
                          <FiEdit2 />
                        </button>
                        {isAdmin && (
                          <button className={iconBtn} title="Update status (admin)" onClick={() => navigate(`/repair/${r._id}/edit`)}>
                            <FiSettings />
                          </button>
                        )}
                        <button className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`} title="Delete" onClick={() => setToDelete(r)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {repairs.map((r) => (
              <div
                key={r._id}
                onClick={() => navigate(`/repair/${r._id}`)}
                className="card cursor-pointer p-5 transition active:scale-[.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold">{r.repairId}</p>
                    <p className="mt-1 font-semibold">{r.productName}</p>
                    <p className="text-sm text-zinc-500">{r.customerName}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-3 text-xs text-zinc-500">Submitted {new Date(r.createdAt).toLocaleDateString()}</p>
                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => navigate(`/repair/${r._id}`)}>
                    View
                  </button>
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => navigate(`/repair/${r._id}/edit-basic`)}>
                    Edit
                  </button>
                  {isAdmin && (
                    <button className="btn btn-secondary btn-sm flex-1" onClick={() => navigate(`/repair/${r._id}/edit`)}>
                      Status
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm !text-red-600" onClick={() => setToDelete(r)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete this repair?"
        description={toDelete ? `Repair ${toDelete.repairId} will be permanently removed.` : ""}
        confirmLabel="Delete"
      />
    </div>
  );
}
