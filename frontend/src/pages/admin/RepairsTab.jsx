import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiEye, FiTool, FiTrash2 } from "react-icons/fi";
import { API_URL, authHeader } from "../../config";
import { useToast } from "../../components/Toast";
import { Select } from "../../components/inputs";
import { ConfirmDialog } from "../../components/ui";
import { IconButton, NothingHere, SearchBox, TableCard, Td, Toolbar } from "./shared";
import { fmtDate, useFetch } from "./utils";

const STATUSES = ["Pending", "Approved", "In Progress", "Resolved", "Rejected"];

export default function RepairsTab() {
  const toast = useToast();
  const { data, setData, loading } = useFetch("/api/repairs", { sortBy: "submittedAt", order: "desc" });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const repairs = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter(
      (r) =>
        (!status || r.status === status) &&
        (!term ||
          [r.repairId, r.customerName, r.productName].some((v) => String(v || "").toLowerCase().includes(term)))
    );
  }, [data, q, status]);

  const changeStatus = async (repair, next) => {
    if (next === repair.status) return;
    setBusyId(repair._id);
    try {
      const res = await axios.put(`${API_URL}/api/repairs/${repair._id}/admin`, { status: next }, { headers: authHeader() });
      setData((list) => list.map((r) => (r._id === repair._id ? { ...r, ...res.data } : r)));
      toast.success(`${repair.repairId} is now ${next}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't update the repair");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/repairs/${toDelete._id}`, { headers: authHeader() });
      setData((list) => list.filter((r) => r._id !== toDelete._id));
      toast.success("Repair deleted");
      setToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search by repair ID, customer or product" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Toolbar>

      <TableCard
        loading={loading}
        count={repairs.length}
        headers={["Repair", "Customer", "Product", "Status", "Submitted", "Actions"]}
        empty={<NothingHere icon={FiTool} title="No repairs found" description="Repair requests from customers show up here." />}
      >
        {repairs.map((r) => (
          <tr key={r._id} className="transition hover:bg-zinc-50/70">
            <Td className="font-mono text-xs font-semibold">{r.repairId}</Td>
            <Td>{r.customerName}</Td>
            <Td className="text-zinc-600">{r.productName}</Td>
            <Td>
              <Select
                value={r.status}
                disabled={busyId === r._id}
                onChange={(e) => changeStatus(r, e.target.value)}
                className="w-40"
                selectClassName="!py-1.5 text-xs font-medium"
                aria-label={`Status for ${r.repairId}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Td>
            <Td className="text-zinc-600">{fmtDate(r.submittedAt || r.createdAt)}</Td>
            <Td>
              <div className="flex justify-end gap-1">
                <Link
                  to={`/repair/${r._id}`}
                  title="View"
                  aria-label="View"
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <FiEye />
                </Link>
                <Link
                  to={`/repair/${r._id}/edit`}
                  className="btn btn-secondary btn-sm"
                  title="Add the repaired photo and flags"
                >
                  Photo and flags
                </Link>
                <IconButton title="Delete" danger onClick={() => setToDelete(r)}>
                  <FiTrash2 />
                </IconButton>
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title="Delete this repair?"
        description={toDelete ? `Repair ${toDelete.repairId} and its photos will be permanently removed.` : ""}
        confirmLabel="Delete"
      />
    </>
  );
}
