import React, { useMemo, useState } from "react";
import axios from "axios";
import { FiTrash2, FiUserCheck, FiUserMinus, FiUsers } from "react-icons/fi";
import { API_URL, authHeader, formatLKR } from "../../config";
import { useToast } from "../../components/Toast";
import { Select } from "../../components/inputs";
import { Badge, ConfirmDialog } from "../../components/ui";
import { IconButton, NothingHere, SearchBox, TableCard, Td, Toolbar } from "./shared";
import { fmtDate, useFetch } from "./utils";

// The signed-in admin's id, read from the token, so they can't lock themselves out.
const myId = () => {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return p.userId || p.user?.id;
  } catch {
    return null;
  }
};

export default function CustomersTab() {
  const toast = useToast();
  const { data, setData, loading } = useFetch("/api/admin/users");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [roleChange, setRoleChange] = useState(null); // { user, role }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const me = myId();

  const users = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter(
      (u) =>
        (!role || u.role === role) &&
        (!term || [u.name, u.username, u.email].some((v) => String(v || "").toLowerCase().includes(term)))
    );
  }, [data, q, role]);

  const applyRole = async () => {
    setBusy(true);
    try {
      await axios.patch(`${API_URL}/api/admin/users/${roleChange.user._id}/role`, { role: roleChange.role }, { headers: authHeader() });
      setData((l) => l.map((u) => (u._id === roleChange.user._id ? { ...u, role: roleChange.role } : u)));
      toast.success(roleChange.role === "admin" ? "Admin access granted" : "Admin access removed");
      setRoleChange(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't change the role");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await axios.delete(`${API_URL}/api/admin/users/${toDelete._id}`, { headers: authHeader() });
      setData((l) => l.filter((u) => u._id !== toDelete._id));
      toast.success("Account deleted");
      setToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search by name, username or email" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
          <option value="">Everyone</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
        </Select>
      </Toolbar>

      <TableCard
        loading={loading}
        count={users.length}
        headers={["Customer", "Contact", "Orders", "Spent", "Joined", "Role", "Actions"]}
        empty={<NothingHere icon={FiUsers} title="No accounts found" description="Try a different search." />}
      >
        {users.map((u) => {
          const isMe = u._id === me;
          return (
            <tr key={u._id} className="transition hover:bg-zinc-50/70">
              <Td>
                <div className="flex items-center gap-3">
                  {u.profileImage ? (
                    <img src={u.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-semibold uppercase text-white">
                      {u.username?.[0]}
                    </span>
                  )}
                  <div>
                    <p className="font-medium">
                      {u.name} {isMe && <span className="text-xs font-normal text-zinc-400">(you)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">@{u.username}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <p>{u.email}</p>
                <p className="text-xs text-zinc-500">{u.mobile}</p>
              </Td>
              <Td className="text-zinc-600">{u.orders}</Td>
              <Td className="font-semibold">{formatLKR(u.spent)}</Td>
              <Td className="text-zinc-600">{fmtDate(u.createdAt)}</Td>
              <Td>{u.role === "admin" ? <Badge tone="dark">Admin</Badge> : <Badge>Customer</Badge>}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  {u.role === "admin" ? (
                    <IconButton title="Remove admin access" disabled={isMe} onClick={() => setRoleChange({ user: u, role: "user" })}>
                      <FiUserMinus />
                    </IconButton>
                  ) : (
                    <IconButton title="Make admin" onClick={() => setRoleChange({ user: u, role: "admin" })}>
                      <FiUserCheck />
                    </IconButton>
                  )}
                  <IconButton title="Delete account" danger disabled={isMe} onClick={() => setToDelete(u)}>
                    <FiTrash2 />
                  </IconButton>
                </div>
              </Td>
            </tr>
          );
        })}
      </TableCard>

      <ConfirmDialog
        open={Boolean(roleChange)}
        onClose={() => setRoleChange(null)}
        onConfirm={applyRole}
        loading={busy}
        title={roleChange?.role === "admin" ? "Make this person an admin?" : "Remove admin access?"}
        description={
          roleChange
            ? roleChange.role === "admin"
              ? `${roleChange.user.username} will be able to manage products, orders, repairs, warranties and other accounts. They need to sign in again for it to apply.`
              : `${roleChange.user.username} will become a regular customer again.`
            : ""
        }
        confirmLabel={roleChange?.role === "admin" ? "Make admin" : "Remove access"}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy}
        danger
        title="Delete this account?"
        description={toDelete ? `${toDelete.username} (${toDelete.email}) will be permanently removed. Their orders and warranties stay in the system.` : ""}
        confirmLabel="Delete account"
      />
    </>
  );
}
