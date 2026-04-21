import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardTopbar />

          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}