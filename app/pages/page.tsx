"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { createPage, fetchPages, getCommunityPages, saveCommunityPages } from "../lib/api";

export default function PagesPage() {
  const [pages, setPages] = useState<Array<{ id: string; name: string; category: string; followers?: number }>>(() => getCommunityPages());
  const [pageName, setPageName] = useState("");
  const [category, setCategory] = useState("Business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchPages()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const nextPages = data.map((page) => ({ ...page, followers: page.followers || 0 }));
          setPages(nextPages);
          saveCommunityPages(nextPages);
        }
      })
      .catch(() => {
        const fallback = getCommunityPages();
        setPages(fallback);
      });
  }, []);

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    if (!pageName.trim()) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const newPage = await createPage({ name: pageName, category });
      const nextPages = [{ id: newPage.id, name: newPage.name, category: newPage.category, followers: 1 }, ...pages];
      setPages(nextPages);
      saveCommunityPages(nextPages);
      setPageName("");
      setSuccessMsg("Page created successfully! (₦50 creation fee deducted)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page. Check wallet balance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Pages" subtitle="Support local businesses, organizations and community initiatives through dedicated pages. (Creation fee: ₦50)">
      <section className="card-grid" style={{ marginBottom: "2rem" }}>
        <article className="panel-card" style={{ gridColumn: "1 / -1" }}>
          <h2>Create a New Page</h2>
          <p className="intro">Creating an official page costs ₦50 from your wallet balance.</p>
          <form onSubmit={handleCreatePage} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="Page name"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              required
              style={{ flex: "1 1 200px", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #ccc" }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #ccc" }}
            >
              <option value="Business">Business</option>
              <option value="Church">Church</option>
              <option value="School">School</option>
              <option value="Organization">Organization</option>
            </select>
            <button className="button button-small" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Page (₦50)"}
            </button>
          </form>
          {error ? <p className="form-error" style={{ color: "#d9534f", marginTop: "0.5rem" }}>{error}</p> : null}
          {successMsg ? <p style={{ color: "#2e7d32", marginTop: "0.5rem", fontWeight: 600 }}>{successMsg}</p> : null}
        </article>
      </section>

      <section className="card-grid">
        {pages.map((page) => (
          <Link href={`/pages/${page.id}`} key={page.id} className="panel-card community-link">
            <h2>{page.name}</h2>
            <p>Category: {page.category}</p>
            <p><strong>{page.followers || 0}</strong> followers · Open page →</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
