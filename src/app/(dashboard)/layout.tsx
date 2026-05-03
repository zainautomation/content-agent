import Sidebar from "@/components/layout/Sidebar";
import WorkspaceLoader from "@/components/WorkspaceLoader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      <WorkspaceLoader />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
