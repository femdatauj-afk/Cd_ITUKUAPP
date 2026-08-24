"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { createPage, fetchPages, getCommunityPages, saveCommunityPages } from "../lib/api";

export default function PagesPage() {
  const [pages, setPages] = useState<Array<{ id: string; slug?: string | null; name: string; category: string; followers?: number }>>([]);
  const [pageName, setPageName] = useState("");
  const [category, setCategory] = useState("Business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [followedPages, setFollowedPages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ituku-page-follows") || "{}");
      setFollowedPages(saved && typeof saved === "object" ? saved : {});
    } catch {
      setFollowedPages({});
    }
  }, []);

  const togglePageFollow = (pageId: string) => {
    setFollowedPages((current) => {
      const next = { ...current, [pageId]: !current[pageId] };
      localStorage.setItem("ituku-page-follows", JSON.stringify(next));
      return next;
    });
  };
  const [successMsg, setSuccessMsg] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchPages()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const nextPages = data.map((page) => ({ ...page, followers: page.followers || 0 }));
          setPages(nextPages);
          saveCommunityPages(nextPages);
        } else {
          setPages(getCommunityPages());
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
      const nextPages = [{ id: newPage.id, slug: newPage.slug, name: newPage.name, category: newPage.category, followers: 1 }, ...pages];
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

  const visiblePages = pages.filter((page) =>
    (filter === "All" || page.category === filter) && page.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell title="Pages" subtitle="Build a trusted home for your business, organization, school, or community initiative.">
      <style jsx>{` .pages-shell{display:grid;gap:20px}.pages-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:20px;padding:28px;border-radius:22px;background:linear-gradient(120deg,#0b6737,#14834d);color:#fff;box-shadow:0 18px 34px rgba(11,103,55,.18)}.pages-hero h2{margin:0 0 10px;font-family:"Playfair Display",Georgia,serif;font-size:30px}.pages-hero p{max-width:600px;margin:0;color:#dff2e4;line-height:1.7}.pages-fee{align-self:center;padding:18px;border:1px solid rgba(255,255,255,.25);border-radius:16px;background:rgba(255,255,255,.1)}.pages-fee strong{display:block;font-size:28px}.pages-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.pages-search{flex:1 1 240px;padding:13px 15px;border:1px solid #dce8dd;border-radius:12px;background:#fff}.pages-filter{padding:13px;border:1px solid #dce8dd;border-radius:12px;background:#fff}.page-create{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center}.page-create input,.page-create select{width:100%;padding:13px;border:1px solid #dce8dd;border-radius:12px;background:#fff}.page-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.page-tile{display:grid;gap:14px;padding:20px;border:1px solid #e0ebe1;border-radius:18px;background:#fff;box-shadow:0 8px 20px rgba(17,54,33,.05);transition:transform .2s,box-shadow .2s}.page-tile:hover{transform:translateY(-3px);box-shadow:0 16px 28px rgba(17,54,33,.1)}.page-tile-head{display:flex;justify-content:space-between;gap:12px}.page-avatar{display:grid;width:48px;height:48px;place-items:center;border-radius:14px;background:#e6f3e8;color:#0b6737;font-weight:800}.page-category{padding:6px 9px;border-radius:999px;background:#f1f7f1;color:#58705e;font-size:11px;font-weight:700;height:max-content}.page-tile h3{margin:0;color:#17251b}.page-tile p{margin:0;color:#66756a;font-size:13px}.page-empty{padding:36px;text-align:center;border:1px dashed #cbdccc;border-radius:18px;color:#6a796c}@media(max-width:760px){.pages-hero{grid-template-columns:1fr}.page-create{grid-template-columns:1fr}.page-grid{grid-template-columns:1fr}}`}</style>
      <div className="pages-shell">
        <section className="pages-hero"><div><p className="eyebrow" style={{color:"#dff2e4"}}>ITUKU PAGE DIRECTORY</p><h2>Give your work a home people can trust.</h2><p>Create a dedicated presence for your business, church, school, or organization and keep your community updated in one place.</p></div><div className="pages-fee"><span>Page creation</span><strong>₦50</strong><small>deducted only after backend validation</small></div></section>
        <section className="panel-card">
          <div className="pages-toolbar"><input className="pages-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages by name" /><select className="pages-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Business</option><option>Church</option><option>School</option><option>Organization</option></select></div>
          <form className="page-create" onSubmit={handleCreatePage} style={{marginTop:16}}>
            <input
              type="text"
              placeholder="Page name"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Business">Business</option>
              <option value="Church">Church</option>
              <option value="School">School</option>
              <option value="Organization">Organization</option>
            </select>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Page (₦50)"}
            </button>
          </form>
          {error ? <p className="form-error" style={{ color: "#d9534f", marginTop: "0.5rem" }}>{error}</p> : null}
          {successMsg ? <p style={{ color: "#2e7d32", marginTop: "0.5rem", fontWeight: 600 }}>{successMsg}</p> : null}
        </section>
        <section className="page-grid">
        {visiblePages.length > 0 ? visiblePages.map((page) => (
          <article key={page.id} className="page-tile">
            <Link href={`/pages/${page.slug || page.id}`} className="page-tile-link">
              <div className="page-tile-head"><span className="page-avatar">{page.name.slice(0,2).toUpperCase()}</span><span className="page-category">{page.category}</span></div><h3>{page.name}</h3><p><strong>{page.followers || 0}</strong> followers</p><p>Open page <span aria-hidden="true">→</span></p>
            </Link>
            <button type="button" onClick={() => togglePageFollow(page.id)} style={{ border: "1px solid #0f6738", borderRadius: 999, background: followedPages[page.id] ? "#0f6738" : "#fff", color: followedPages[page.id] ? "#fff" : "#0f6738", padding: ".55rem .8rem", fontWeight: 800, cursor: "pointer" }}>{followedPages[page.id] ? "Following" : "Follow page"}</button>
          </article>
        )) : <div className="page-empty">No pages match your search.</div>}
        </section>
      </div>
    </AppShell>
  );
}
