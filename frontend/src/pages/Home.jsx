import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiSearch, FiX } from "react-icons/fi";
import { API_URL } from "../config";
import ProductCard from "../components/ProductCard";
import ProductModel from "../components/ProductModel";
import { EmptyState, PageHeader } from "../components/ui";
import { Select } from "../components/inputs";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "mobile", label: "Mobiles", id: "mobile" },
  { key: "laptop", label: "Laptops", id: "laptop" },
  { key: "accessory", label: "Accessories", id: "accessories" },
];

const SORTS = {
  featured: { label: "Featured", fn: null },
  low: { label: "Price: low to high", fn: (a, b) => a.discountPrice - b.discountPrice },
  high: { label: "Price: high to low", fn: (a, b) => b.discountPrice - a.discountPrice },
  name: { label: "Name: A to Z", fn: (a, b) => a.title.localeCompare(b.title) },
};

const SkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="card overflow-hidden">
        <div className="skeleton aspect-square !rounded-none" />
        <div className="space-y-3 p-5">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-6 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  const query = new URLSearchParams(location.search).get("q")?.toLowerCase() || "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (!res.ok) throw new Error("Bad response");
        setProducts(await res.json());
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Scroll to #mobile / #laptop / #accessories once products have rendered.
  useEffect(() => {
    if (loading || !location.hash) return;
    const t = setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, [location.hash, loading]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const matchCat = category === "all" || p.category?.toLowerCase() === category;
      const matchQuery = query ? p.title?.toLowerCase().includes(query) : true;
      return matchCat && matchQuery;
    });
    const sorter = SORTS[sort].fn;
    return sorter ? [...list].sort(sorter) : list;
  }, [products, category, query, sort]);

  const sections = CATEGORIES.filter((c) => c.key !== "all")
    .map((c) => ({ ...c, items: filtered.filter((p) => p.category?.toLowerCase() === c.key) }))
    .filter((s) => s.items.length > 0);

  const grid = (items) => (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p._id} product={p} onSelect={setSelectedProduct} />
      ))}
    </div>
  );

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Shop"
        title={query ? `Results for “${query}”` : "All products"}
        description={
          query
            ? `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`
            : "Phones, laptops and accessories, all with cash-discount pricing."
        }
        actions={
          query && (
            <button onClick={() => navigate("/home")} className="btn btn-secondary btn-sm">
              <FiX /> Clear search
            </button>
          )
        }
      />

      {/* Toolbar */}
      <div className="sticky top-11 z-20 -mx-4 mb-8 flex flex-col gap-3 border-b border-zinc-200/70 bg-zinc-50/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                category === c.key
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:text-zinc-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
          className="w-full sm:w-56"
          selectClassName="!rounded-full !py-2 !pl-4"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <EmptyState
          icon={FiAlertTriangle}
          title="We couldn't load the products"
          description="Make sure the backend server is running, then try again."
          action={
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title={query ? "No products match your search" : "No products yet"}
          description={query ? `Nothing found for “${query}”. Try a different keyword.` : "Check back soon."}
          action={
            query && (
              <Link to="/home" className="btn btn-primary">
                View all products
              </Link>
            )
          }
        />
      ) : category === "all" ? (
        <div className="space-y-16">
          {sections.map((s) => (
            <section key={s.key} id={s.id} className="scroll-mt-32">
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-2xl font-bold sm:text-3xl">{s.label}</h2>
                <span className="text-sm text-zinc-500">{s.items.length} items</span>
              </div>
              {grid(s.items)}
            </section>
          ))}
        </div>
      ) : (
        grid(filtered)
      )}

      <ProductModel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
