"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { fetchWalletBalance, fetchWalletLedger, getSession } from "../lib/api";

export default function CoinsPage() {
  const [balance, setBalance] = useState(0);
  const [activity, setActivity] = useState<Array<{ id: string; type: string; description: string; amount: number; createdAt: string }>>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getSession()?.token) {
      setMessage("Sign in to view your ItukuApp Coin balance.");
      setLoading(false);
      return;
    }
    Promise.all([fetchWalletBalance(), fetchWalletLedger()])
      .then(([wallet, ledger]) => {
        setBalance(wallet.balance);
        setActivity(ledger.map((entry) => ({ id: entry.id, type: entry.type, description: entry.description, amount: entry.amount, createdAt: entry.createdAt })));
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Coin data is unavailable."))
      .finally(() => setLoading(false));
  }, []);

  return <><style jsx global>{`.wallet-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-bottom:20px}.wallet-card{min-height:300px;border-radius:22px;padding:30px;position:relative;overflow:hidden;color:#fff;background:linear-gradient(135deg,#074c2a,#0e8750);box-shadow:0 16px 30px #084b2926}.wallet-card:after{content:"";width:360px;height:360px;right:-135px;bottom:-215px;border-radius:50%;position:absolute;border:1px solid #fff4}.wallet-label{display:block;letter-spacing:1.4px;font-size:10px;font-weight:700;color:#cfebd5}.wallet-card strong{font-size:42px;line-height:1;margin-top:24px;display:block;position:relative;z-index:1}.wallet-card p{margin:8px 0;color:#d5ecd9}.coin-orbit{position:absolute;right:29px;top:27px;width:59px;height:59px;border-radius:50%;display:grid;place-items:center;background:#f2c64c;color:#164425;font-size:28px;box-shadow:0 0 0 11px #ffffff18}.wallet-actions{position:absolute;z-index:1;bottom:27px;display:flex;gap:10px}.wallet-action{font:inherit;font-size:12px;font-weight:700;border:0;border-radius:999px;padding:11px 14px;background:#fff;color:#0b6737;cursor:pointer}.wallet-action.subtle{color:#fff;background:#ffffff21;border:1px solid #fff4}.topup-card{display:flex;flex-direction:column;justify-content:center}.topup-card h2{font-family:Arial,sans-serif;margin:0 0 17px}.amount-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:16px}.amount{background:#f6faf5;border:1px solid #e1eae0;border-radius:11px;padding:11px;cursor:pointer;color:#48614d;font-weight:700}.amount.active{color:#fff;background:#0b6737;border-color:#0b6737}.wallet-message{font-size:12px!important;color:#0b6737!important;margin-bottom:0}.coin-activity{max-width:820px}.section-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.section-row h2{font-family:Arial,sans-serif;margin:0}.coin-badge{border-radius:999px;background:#fff6db;color:#a56d00;padding:7px 11px;font-size:11px;font-weight:700}.activity-row{display:flex;gap:12px;align-items:center;padding:15px 0;border-top:1px solid #edf1eb}.activity-icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#eaf4e9;color:#0b6737;font-size:18px}.activity-row div{display:grid;gap:3px}.activity-row strong{font-size:13px}.activity-row small{font-size:11px;color:#697369}.activity-row>b{margin-left:auto;font-size:13px}.credit{color:#0b6737}.debit{color:#a05b22}@media(max-width:760px){.wallet-layout{grid-template-columns:1fr}.wallet-card{min-height:270px}.wallet-card strong{font-size:37px}.coin-activity{padding:18px}.section-row{align-items:flex-start;gap:12px}.coin-badge{white-space:nowrap}}`}</style><AppShell title="Ituku Coins" subtitle="A simple wallet for community pages, groups and local opportunities.">
    <section className="wallet-layout">
      <article className="wallet-card"><span className="wallet-label">ITUKUAPP WALLET</span><div className="coin-orbit" aria-label="Ituku Coin symbol">₿</div><strong>₿ {balance.toLocaleString()}</strong><p>Available Coin Balance</p><div className="wallet-actions"><button className="wallet-action" type="button" disabled title="Payment provider is not configured">Add Funds unavailable</button><a className="wallet-action subtle" href="#activity">View ledger</a></div></article>
      <article className="panel-card topup-card"><p className="eyebrow">PAYMENT STATUS</p><h2>Coin purchases are protected</h2><p>Payment provider credentials are not configured for this environment. No balance is increased from the frontend.</p>{message && <p className="wallet-message">{message}</p>}</article>
    </section>
    <section id="activity" className="coin-activity panel-card"><div className="section-row"><div><p className="eyebrow">WALLET LEDGER</p><h2>Recent activity</h2></div><span className="coin-badge">ITK Ledger</span></div>{loading ? <p>Loading ledger...</p> : activity.length === 0 ? <p>No wallet transactions yet.</p> : activity.map((entry) => <div className="activity-row" key={entry.id}><span className="activity-icon">{entry.amount >= 0 ? "＋" : "−"}</span><div><strong>{entry.type}</strong><small>{entry.description} · {new Date(entry.createdAt).toLocaleString()}</small></div><b className={entry.amount >= 0 ? "credit" : "debit"}>{entry.amount >= 0 ? "+" : "−"} ITK {Math.abs(entry.amount).toLocaleString()}</b></div>)}</section>
  </AppShell></>;
}
