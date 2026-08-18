"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { fetchVillages } from "../lib/api";

const fallback = ["AMOKOLO","UMUKULU","UGWUNAGBO","OKWENACHALA","OFEINYI","AMATA","UMUNEVONTA","UMUOWOH","UMUONYIBA"].map(name => ({ name, members: 0 }));
const count = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}K` : value.toString();

export default function CommunitiesPage() {
  const [villages, setVillages] = useState(fallback);
  useEffect(() => { fetchVillages().then(setVillages).catch(() => {}); }, []);

  return (
    <>
      <style jsx global>{`
        .communities-shell { display: grid; gap: 22px; }
        .directory-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 24px 26px;
          border-radius: 22px;
          background: linear-gradient(135deg, #0d4d2e 0%, #0e7a4d 100%);
          color: white;
          box-shadow: 0 18px 30px rgba(11, 103, 55, 0.18);
        }
        .directory-hero h3 {
          margin: 4px 0 8px;
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          letter-spacing: -0.05em;
        }
        .directory-hero p { margin: 0; color: rgba(255,255,255,0.8); max-width: 620px; }
        .directory-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 18px;
          border-radius: 999px;
          background: white;
          color: #0b6737;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 12px 20px rgba(0,0,0,0.12);
        }
        .communities-grid {
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:15px;
        }
        .village-community {
          min-height: 173px;
          padding: 19px;
          border-radius: 18px;
          background: linear-gradient(135deg,#fff,#f3f8f1);
          border: 1px solid #e1eae0;
          position:relative;
          overflow:hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .village-community:after {
          content:"";
          position:absolute;
          width:145px;
          height:145px;
          border-radius:50%;
          border:1px solid #0b673728;
          right:-65px;
          top:-65px;
        }
        .village-community:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(11, 103, 55, 0.12);
          border-color: #a7c9a5;
        }
        .village-token {
          width:39px;height:39px;border-radius:12px;background:#0b6737;color:#fff;display:grid;place-items:center;font-weight:800;font-size:11px;
        }
        .village-community h2 { font-family:Arial,sans-serif;font-size:16px;margin:18px 0 5px; }
        .village-community p { margin:0;color:#657165;font-size:11px; }
        .village-community b {
          position:absolute;right:18px;bottom:17px;color:#0b6737;font-size:12px;
        }
        @media(max-width:850px){ .communities-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } .directory-hero { flex-direction: column; align-items: flex-start; } }
        @media(max-width:500px){ .communities-grid { grid-template-columns: 1fr; } }
      `}</style>

      <AppShell title="Village Communities" subtitle="Nine villages. One connected Ituku community. Member counts update from community membership.">
        <section className="communities-shell">
          <div className="directory-hero">
            <div>
              <p className="eyebrow" style={{ color: "#f7d774", marginBottom: 8 }}>COMMUNITY DIRECTORY</p>
              <h3>Meet, chat, share and hold community meetings.</h3>
              <p>Each village has a dedicated community room for updates, polls, moderation, leadership coordination and coin-based fines.</p>
            </div>
            <Link className="directory-button" href="/communities/community-dashboard">Open dashboard</Link>
          </div>

          <section className="communities-grid">
            {villages.map(village => (
              <Link className="village-community" href={`/communities/${village.name.toLowerCase()}`} key={village.name}>
                <span className="village-token">{village.name.slice(0,2)}</span>
                <h2>{village.name}</h2>
                <p>Village community • updates, chat, polls and meetings</p>
                <b>{count(village.members)} {village.members === 1 ? "member" : "members"} →</b>
              </Link>
            ))}
          </section>
        </section>
      </AppShell>
    </>
  );
}
