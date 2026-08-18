"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { fetchPages } from "../../lib/api";

export default function PageDetail() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<{ id: string; name: string; category: string; followers: number } | null>(null);

  useEffect(() => {
    fetchPages()
      .then((pages) => {
        const found = pages.find((item) => item.id === id) ?? null;
        setPage(found ? { ...found, followers: found.followers || 0 } : null);
      })
      .catch(() => {
        const raw = localStorage.getItem('ituku-community-pages');
        if (!raw) return;
        try {
          const pages = JSON.parse(raw);
          setPage(pages.find((item: { id: string }) => item.id === id) ?? null);
        } catch {
          setPage(null);
        }
      });
  }, [id]);

  const count = page?.followers ?? 0;

  return (
    <AppShell title={page?.name || "Community Page"} subtitle="Follow community initiatives, businesses and organisations.">
      <section className="panel-card community-detail">
        <p className="eyebrow">{page?.category || "ITUKU COMMUNITY PAGE"}</p>
        <h2>{page?.name || "Page not found"}</h2>
        <p className="intro"><strong>{count.toLocaleString()}</strong> followers · Receive verified updates and community stories.</p>
        <div className="community-count">
          <strong>{count.toLocaleString()}</strong>
          <span>Followers</span>
          <strong>Open</strong>
          <span>Community page</span>
        </div>
        <button className="button" type="button">Follow page</button>
        <Link className="text-link" href="/pages">Back to pages</Link>
      </section>
    </AppShell>
  );
}
