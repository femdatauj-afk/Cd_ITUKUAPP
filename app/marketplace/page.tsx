"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/app-shell";
import { createMarketplaceListing, fetchMarketplaceListings } from "../lib/api";

const initialForm = {
  title: "",
  price: "",
  category: "Food",
  location: "Amokolo market",
  description: "",
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<Array<Record<string, any>>>([]);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Use live location");

  useEffect(() => {
    let active = true;

    fetchMarketplaceListings().then((listings) => {
      if (active) setProducts(listings);
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const totalListings = useMemo(() => products.length, [products]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location unavailable on this device");
      return;
    }

    setLocationStatus("Fetching your location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude.toFixed(6));
        const longitude = Number(coords.longitude.toFixed(6));
        const nextLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        setForm((current) => ({
          ...current,
          location: current.location && current.location !== "Amokolo market" ? current.location : nextLocation,
          latitude,
          longitude,
        }));
        setLocationStatus("Live location captured");
      },
      () => {
        setLocationStatus("Unable to access live location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = form.title.trim();
    const price = Number(form.price);
    if (!title || !price || price <= 0) return;

    setIsSubmitting(true);
    try {
      const nextListing = await createMarketplaceListing({
        title,
        description: form.description.trim() || "Fresh listing from the Ituku community.",
        category: form.category,
        condition: "New",
        price,
        village: form.location.trim() || "Ituku community",
        contactPreference: "WhatsApp",
        latitude: typeof form.latitude === "number" ? form.latitude : undefined,
        longitude: typeof form.longitude === "number" ? form.longitude : undefined,
      });

      setProducts((current) => [nextListing, ...current]);
      setForm({ ...initialForm, latitude: undefined, longitude: undefined });
      setLocationStatus("Use live location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Marketplace" subtitle="Buy, sell and discover trusted community listings across Ituku.">
      <section className="marketplace-shell">
        <div className="marketplace-header panel-card">
          <div>
            <p className="eyebrow">COMMUNITY STORE</p>
            <h2>Verified local listings</h2>
          </div>
          <div className="marketplace-summary">
            <strong>{totalListings}</strong>
            <span>active listings</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="panel-card marketplace-form">
          <h3>Sell something</h3>
          <div className="marketplace-form-grid">
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Item or service title" />
            <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" min="1" placeholder="Price in ₦" />
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              <option value="Food">Food</option>
              <option value="Handcraft">Handcraft</option>
              <option value="Services">Services</option>
              <option value="Education">Education</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Home">Home</option>
            </select>
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
          </div>
          <div className="location-actions">
            <button type="button" className="secondary-button" onClick={handleUseLocation}>{locationStatus}</button>
            {typeof form.latitude === "number" && typeof form.longitude === "number" && (
              <span className="location-tag">{form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>
            )}
          </div>
          <textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Give buyers a quick description" />
          <button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Publishing..." : "Publish listing"}</button>
        </form>

        <section className="listing-grid">
          {products.map((product: Record<string, any>) => (
            <article key={product.id} className="panel-card listing-card">
              <div className="listing-badge">{product.badge}</div>
              <div className="listing-thumb">{product.category.slice(0, 2).toUpperCase()}</div>
              <div className="listing-main">
                <h3>{product.title}</h3>
                <p className="listing-price">₦{Number(product.price).toLocaleString()}</p>
                <p className="listing-meta">{product.category} · {product.location}</p>
                <p className="listing-copy">{product.description}</p>
                <div className="listing-footer">
                  <span>Seller: {product.seller}</span>
                  <button type="button">Contact seller</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>

      <style jsx global>{`
        .marketplace-shell { display: grid; gap: 20px; }
        .marketplace-header { padding: 20px 22px; display: flex; justify-content: space-between; align-items: center; gap: 18px; }
        .marketplace-header h2 { margin: 0; font-size: 1.75rem; }
        .marketplace-summary { display: grid; justify-items: end; }
        .marketplace-summary strong { font-size: 2rem; }
        .marketplace-summary span { color: #617166; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .marketplace-form { padding: 22px; }
        .marketplace-form h3 { margin: 0 0 16px; }
        .marketplace-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .marketplace-form input, .marketplace-form select, .marketplace-form textarea {
          width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #dfe9e0; background: #fff; color: #1d2a21;
        }
        .location-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
        .secondary-button { border: 1px solid #dfe9e0; background: #f3faf5; color: #0d4d2d; border-radius: 999px; padding: 9px 12px; font-weight: 700; cursor: pointer; }
        .location-tag { display: inline-flex; align-items: center; background: #ecf9f0; color: #0f6738; border: 1px solid #d8efd9; border-radius: 999px; padding: 6px 10px; font-size: 0.74rem; font-weight: 700; }
        .marketplace-form textarea { grid-column: 1 / -1; margin-top: 12px; resize: vertical; }
        .marketplace-form button { margin-top: 16px; }
        .listing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
        .listing-card { padding: 16px; display: grid; gap: 14px; }
        .listing-badge { justify-self: start; background: #eefaf0; color: #0f6738; border-radius: 999px; padding: 6px 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .listing-thumb { width: 58px; height: 58px; border-radius: 18px; background: linear-gradient(135deg, #dfeee1, #b7e2c0); display: grid; place-items: center; font-weight: 800; color: #124d2f; }
        .listing-main { display: grid; gap: 8px; }
        .listing-main h3 { margin: 0; font-size: 1.2rem; }
        .listing-price { margin: 0; font-size: 1.5rem; font-weight: 800; color: #0d4d2d; }
        .listing-meta, .listing-copy { margin: 0; color: #596d61; }
        .listing-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 8px; }
        .listing-footer span { color: #435748; font-weight: 600; }
        .listing-footer button { border: 0; border-radius: 999px; background: #0f6738; color: white; padding: 9px 12px; font-weight: 700; cursor: pointer; }
        @media (max-width: 980px) { .listing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) { .marketplace-form-grid, .listing-grid { grid-template-columns: 1fr; } .marketplace-header { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </AppShell>
  );
}
