import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth, currentOrganization } from "@/lib/auth-utils";
import { ModalProvider } from "@/components/providers/modal-provider";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { AppHeader } from "@/components/app-header";
import { EmptyOrganization } from "@/components/empty-organization";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const org = await currentOrganization();

  return (
    <SidebarProvider className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {org ? (
            <div className="container mx-auto p-6 space-y-6">
              <BreadcrumbNav />
              {children}
            </div>
          ) : (
            <EmptyOrganization />
          )}
        </main>
      </div>
      <ModalProvider />
    </SidebarProvider>
  );
}
