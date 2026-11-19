import React, { useMemo, useState } from "react";
import axios from "axios";
import { FiPlus, FiShield, FiTrash2 } from "react-icons/fi";
import { API_URL, authHeader } from "../../config";
import { useToast } from "../../components/Toast";
import { Select } from "../../components/inputs";
import { Badge, ConfirmDialog, Field, Modal, Spinner } from "../../components/ui";
import { IconButton, NothingHere, SearchBox, TableCard, Td, Toolbar } from "./shared";
import { fmtDate, useFetch } from "./utils";

const today = () => new Date().toISOString().slice(0, 10);

function RegisterForm({ onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ productName: "", serialNumber: "", purchasedAt: today(), warrantyMonths: 12, ownerEmail: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, warrantyMonths: Number(form.warrantyMonths) };
      if (!body.serialNumber.trim()) delete body.serialNumber;
      if (!body.ownerEmail.trim()) delete body.ownerEmail;
      const res = await axios.post(`${API_URL}/api/warranty`, body, { headers: authHeader() });
      toast.success(`Registered ${res.data.serialNumber}`);
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't register the warranty");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
      <div className="pr-10">
        <h3 className="text-xl font-semibold">Register an in-store sale</h3>
        <p className="mt-1 text-sm text-zinc-500">Creates a warranty for a unit that was not bought online.</p>
      </div>
      <Field label="Product" htmlFor="w-name">
        <input id="w-name" className="input" value={form.productName} onChange={set("productName")} maxLength={120} placeholder="iPhone 16 Pro Max" required />
      </Field>
      <Field label="Serial number" htmlFor="w-serial" hint="Leave empty to generate a Voltora serial (VLT-XXXX-XXXX).">
        <input id="w-serial" className="input" value={form.serialNumber} onChange={set("serialNumber")} placeholder="Optional" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Purchase date" htmlFor="w-date">
          <input id="w-date" type="date" max={today()} className="input" value={form.purchasedAt} onChange={set("purchasedAt")} required />
        </Field>
        <Field label="Coverage (months)" htmlFor="w-months">
          <Select id="w-months" value={form.warrantyMonths} onChange={set("warrantyMonths")}>
            {[6, 12, 18, 24, 36].map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Customer email" htmlFor="w-email" hint="Optional. Links the warranty to that account so they see it under My warranties.">
        <input id="w-email" type="email" className="input" value={form.ownerEmail} onChange={set("ownerEmail")} placeholder="customer@example.com" />
      </Field>
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />} {saving ? "Saving…" : "Register warranty"}
        </button>
      </div>
    </form>
  );
}

export default function WarrantiesTab() {
  const toast = useToast();
  const { data, setData, loading, reload } = useFetch("/api/admin/warranties");
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [registering, setRegistering] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter(
      (w) =>
        (!state || w.status === state) &&
        (!term ||
          w.serialNumber.toLowerCase().includes(term) ||
          w.productName.toLowerCase().includes(term) ||
          (w.owner?.email || "").toLowerCase().includes(term))
    );
  }, [data, q, state]);

  const remove = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/admin/warranties/${toDelete._id}`, { headers: authHeader() });
      setData((l) => l.filter((w) => w._id !== toDelete._id));
      toast.success("Warranty deleted");
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
        <SearchBox value={q} onChange={setQ} placeholder="Search by serial, product or owner" />
        <Select value={state} onChange={(e) => setState(e.target.value)} className="w-44">
          <option value="">All warranties</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </Select>
        <button className="btn btn-primary" onClick={() => setRegistering(true)}>
          <FiPlus /> Register in-store sale
        </button>
      </Toolbar>

      <TableCard
        loading={loading}
        count={list.length}
        headers={["Serial", "Product", "Owner", "Purchased", "Expires", "Status", "Actions"]}
        empty={<NothingHere icon={FiShield} title="No warranties found" description="Warranties are created automatically when an order is paid." />}
      >
        {list.map((w) => (
          <tr key={w._id} className="transition hover:bg-zinc-50/70">
            <Td className="font-mono text-xs font-semibold">{w.serialNumber}</Td>
            <Td className="font-medium">{w.productName}</Td>
            <Td className="text-zinc-600">{w.owner ? w.owner.email : <span className="text-zinc-400">Not linked</span>}</Td>
            <Td className="text-zinc-600">{fmtDate(w.purchasedAt)}</Td>
            <Td className="text-zinc-600">{fmtDate(w.expiresAt)}</Td>
            <Td>
              {w.status === "active" ? <Badge tone="dark">Active, {w.daysRemaining}d left</Badge> : <Badge>Expired</Badge>}
            </Td>
            <Td>
              <div className="flex justify-end">
                <IconButton title="Delete" danger onClick={() => setToDelete(w)}>
                  <FiTrash2 />
                </IconButton>
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      <Modal open={registering} onClose={() => setRegistering(false)} maxWidth="max-w-lg" label="Register warranty">
        {registering && (
          <RegisterForm
            onClose={() => setRegistering(false)}
            onSaved={() => {
              setRegistering(false);
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title="Delete this warranty?"
        description={toDelete ? `${toDelete.serialNumber} will no longer be found by the public warranty check.` : ""}
        confirmLabel="Delete"
      />
    </>
  );
}
