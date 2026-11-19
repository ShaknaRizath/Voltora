import React, { useMemo, useState } from "react";
import axios from "axios";
import { FiBox, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { API_URL, assetUrl, authHeader, formatLKR } from "../../config";
import { useToast } from "../../components/Toast";
import { Select } from "../../components/inputs";
import { Badge, ConfirmDialog, Field, ImagePicker, Modal, Spinner } from "../../components/ui";
import { IconButton, NothingHere, SearchBox, TableCard, Td, Toolbar } from "./shared";
import { useFetch } from "./utils";

const CATEGORIES = [
  { value: "mobile", label: "Phone" },
  { value: "laptop", label: "Laptop" },
  { value: "accessory", label: "Accessory" },
];
const catLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;

const EMPTY = { title: "", category: "mobile", price: "", discountPrice: "", description: "" };

function ProductForm({ product, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    product
      ? {
          title: product.title,
          category: product.category,
          price: product.price,
          discountPrice: product.discountPrice,
          description: product.description || "",
        }
      : EMPTY
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!product && !file) return toast.error("Please add a product image");
    if (Number(form.discountPrice) > Number(form.price)) return toast.error("Sale price can't be higher than the regular price");

    setSaving(true);
    try {
      let image = product?.image;
      if (file) {
        const data = new FormData();
        data.append("image", file);
        const up = await axios.post(`${API_URL}/api/admin/upload`, data, { headers: authHeader() });
        image = up.data.path;
      }
      const body = { ...form, price: Number(form.price), discountPrice: Number(form.discountPrice), image };
      const res = product
        ? await axios.put(`${API_URL}/api/products/${product._id}`, body, { headers: authHeader() })
        : await axios.post(`${API_URL}/api/products`, body, { headers: authHeader() });
      toast.success(product ? "Product updated" : "Product added");
      onSaved(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't save the product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
      <h3 className="pr-10 text-xl font-semibold">{product ? "Edit product" : "Add product"}</h3>
      <Field label="Name" htmlFor="p-title">
        <input id="p-title" className="input" value={form.title} onChange={set("title")} maxLength={120} required />
      </Field>
      <Field label="Category" htmlFor="p-cat">
        <Select id="p-cat" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Regular price (LKR)" htmlFor="p-price">
          <input id="p-price" type="number" min="0" step="any" className="input" value={form.price} onChange={set("price")} required />
        </Field>
        <Field label="Sale price (LKR)" htmlFor="p-sale" hint="What customers pay">
          <input id="p-sale" type="number" min="0" step="any" className="input" value={form.discountPrice} onChange={set("discountPrice")} required />
        </Field>
      </div>
      <Field label="Description" htmlFor="p-desc">
        <textarea id="p-desc" rows={3} maxLength={2000} className="input" value={form.description} onChange={set("description")} />
      </Field>
      <ImagePicker
        label="Image"
        file={file}
        onChange={setFile}
        currentUrl={product ? assetUrl(product.image) : ""}
      />
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />} {saving ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}

export default function ProductsTab() {
  const toast = useToast();
  const { data, setData, loading } = useFetch("/api/products");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const products = useMemo(
    () =>
      (data || []).filter(
        (p) => (!cat || p.category === cat) && p.title.toLowerCase().includes(q.trim().toLowerCase())
      ),
    [data, q, cat]
  );

  const byPosition = (list) => [...list].sort((a, b) => (a.sortOrder ?? 1e9) - (b.sortOrder ?? 1e9));

  const onSaved = (saved) => {
    setData((list) => byPosition(list.some((p) => p._id === saved._id) ? list.map((p) => (p._id === saved._id ? saved : p)) : [...list, saved]));
    setEditing(null);
  };

  // Type a new number and press Enter (or click away). The server shifts the others so numbers stay 1..n.
  const move = async (product, raw) => {
    const position = Number.parseInt(raw, 10);
    if (!Number.isInteger(position) || position < 1) return toast.error("Enter a whole number, 1 or higher");
    if (position === product.sortOrder) return;
    try {
      const res = await axios.patch(`${API_URL}/api/admin/products/${product._id}/position`, { position }, { headers: authHeader() });
      const next = new Map(res.data.map((o) => [o._id, o.sortOrder]));
      setData((list) => byPosition(list.map((p) => ({ ...p, sortOrder: next.get(p._id) ?? p.sortOrder }))));
      toast.success(`${product.title} is now number ${next.get(product._id)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't change the order");
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/products/${toDelete._id}`, { headers: authHeader() });
      // Positions close the gap on the server, so renumber the same way here.
      setData((list) => list.filter((p) => p._id !== toDelete._id).map((p, i) => ({ ...p, sortOrder: i + 1 })));
      toast.success("Product deleted");
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
        <SearchBox value={q} onChange={setQ} placeholder="Search products" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          <FiPlus /> Add product
        </button>
      </Toolbar>

      <p className="-mt-1 mb-4 text-sm text-zinc-500">
        The number is the order in the shop: 1 is shown first. Type a new number and press Enter, and the others shift to make room.
        Phones, laptops and accessories keep their own sections, so the numbers set the order inside each one.
      </p>

      <TableCard
        loading={loading}
        count={products.length}
        headers={["No.", "Product", "Category", "Regular", "Sale", "Reviews", "Actions"]}
        empty={<NothingHere icon={FiBox} title="No products found" description="Try a different search, or add a new product." />}
      >
        {products.map((p) => (
          <tr key={p._id} className="transition hover:bg-zinc-50/70">
            <Td>
              <input
                key={`${p._id}-${p.sortOrder}`}
                type="number"
                min="1"
                defaultValue={p.sortOrder}
                aria-label={`Position of ${p.title}`}
                title="Shop position. 1 is shown first."
                onBlur={(e) => move(p, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="input !w-16 !px-2.5 !py-1.5 text-center font-semibold"
              />
            </Td>
            <Td>
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  <img src={assetUrl(p.image)} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                </span>
                <span className="font-medium text-zinc-900">{p.title}</span>
              </div>
            </Td>
            <Td>
              <Badge>{catLabel(p.category)}</Badge>
            </Td>
            <Td className="text-zinc-500 line-through">{formatLKR(p.price)}</Td>
            <Td className="font-semibold">{formatLKR(p.discountPrice)}</Td>
            <Td className="text-zinc-600">{p.reviews?.length || 0}</Td>
            <Td>
              <div className="flex justify-end gap-1">
                <IconButton title="Edit" onClick={() => setEditing(p)}>
                  <FiEdit2 />
                </IconButton>
                <IconButton title="Delete" danger onClick={() => setToDelete(p)}>
                  <FiTrash2 />
                </IconButton>
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="max-w-xl" label="Product form">
        {editing && <ProductForm product={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title="Delete this product?"
        description={toDelete ? `"${toDelete.title}" will be removed from the store. Past orders keep their own copy.` : ""}
        confirmLabel="Delete"
      />
    </>
  );
}
