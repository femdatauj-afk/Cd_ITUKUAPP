"use client";

import { useState } from "react";
import { AppShell } from "../components/app-shell";
import { defaultProfileSettings, getProfileSettings, saveProfileSettings } from "../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => getProfileSettings());
  const [saved, setSaved] = useState(false);

  function updatePrivacy(value: boolean) {
    const next = { ...settings, privacy: { ...settings.privacy, profile: value ? "Everyone" : "Only me" } };
    setSettings(next);
    saveProfileSettings(next);
    setSaved(true);
  }

  return (
    <AppShell title="Settings" subtitle="Control your ItukuApp experience and privacy.">
      <section style={{ maxWidth: 760, margin: "0 auto", padding: 20 }}>
        <div className="feed-post" style={{ padding: 20 }}>
          <p className="eyebrow">PRIVACY</p>
          <h2>Profile visibility</h2>
          <label className="checkbox-row">
            <input type="checkbox" checked={settings.privacy.profile === "Everyone"} onChange={(event) => updatePrivacy(event.target.checked)} />
            <span>Allow everyone to view my profile</span>
          </label>
          <p className="muted-block">Coin balances remain private unless you explicitly enable sharing.</p>
          {saved && <p className="success-message">Settings saved.</p>}
        </div>
        <button className="button-secondary" type="button" onClick={() => { setSettings(defaultProfileSettings); saveProfileSettings(defaultProfileSettings); setSaved(true); }} style={{ marginTop: 16 }}>
          Restore default settings
        </button>
      </section>
    </AppShell>
  );
}
