import { AppShell } from "../components/app-shell";

export default function DeveloperPage() {
  return (
    <AppShell title="Developer" subtitle="Meet the founder and builder behind ItukuApp.">
      <section className="profile-card">
        <div className="profile-cover" />
        <div className="profile-details">
          <div>
            <h2>Ujam Chinedu Henry</h2>
            <p>Student • Enugu State • Awgu LGA</p>
            <p>Phone: 08142229477</p>
            <p>Email: Henry4683328@gmail.com</p>
          </div>
          <div className="chip-row">
            <span className="chip">Web Designing</span>
            <span className="chip">Football</span>
            <span className="chip">ITUKUAPP</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
