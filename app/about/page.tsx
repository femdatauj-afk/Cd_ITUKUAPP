import { AppShell } from "../components/app-shell";

export default function AboutPage() {
  return (
    <AppShell title="About ItukuApp" subtitle="The official digital platform for Ituku Community and its nine villages.">
      <section className="panel-card">
        <p>
          ItukuApp exists to unite the nine villages and the wider Ituku community through communication, education, business, youth development and shared progress.
        </p>
      </section>
    </AppShell>
  );
}
