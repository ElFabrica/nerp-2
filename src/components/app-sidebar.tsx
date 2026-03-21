"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Box,
  Building,
  ChevronDown,
  ChevronsUpDown,
  GalleryVerticalEnd,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Store,
  Tag,
  TrendingUp,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect, useState } from "react";
import { ActiveOrganization } from "@/lib/auth-types";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Produtos",
    href: "/produtos",
    icon: Package,
    children: [
      { name: "Produtos", href: "/produtos", icon: Package },
      { name: "Categorias", href: "/produtos/categorias", icon: Tag },
    ],
  },
  {
    name: "Frente de caixa",
    href: "/vendas",
    icon: ShoppingCart,
  },
  {
    name: "Estoque",
    href: "/estoque",
    icon: Box,
    children: [
      {
        name: "Movimentações",
        href: "/estoque/movimentacoes",
        icon: TrendingUp,
      },
    ],
  },
  // {
  //   name: "Financeiro",
  //   href: "/financeiro",
  //   icon: DollarSign,
  //   children: [
  //     { name: "Contas a Receber", href: "/financeiro/receber", icon: Inbox },
  //     { name: "Contas a Pagar", href: "/financeiro/pagar", icon: Receipt },
  //     { name: "Fluxo de Caixa", href: "/financeiro/fluxo", icon: CreditCard },
  //   ],
  // },
  {
    name: "Clientes",
    href: "/clientes",
    icon: UsersIcon,
  },
  // {
  //   name: "Fornecedores",
  //   href: "/fornecedores",
  //   icon: Building2,
  // },
  {
    name: "Catálogo Online",
    href: "/catalogo",
    icon: Store,
  },
  // {
  //   name: "Relatórios",
  //   href: "/relatorios",
  //   icon: BarChart3,
  // },
  // {
  //   name: "Configurações",
  //   href: "/configuracoes",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgMenu />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="flex-1">
              <SidebarMenu>
                {navigation.map((item) => {
                  // const isActive = pathname === item.href;
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren) {
                    return (
                      <Collapsible
                        key={item.name}
                        asChild
                        defaultOpen={pathname.startsWith(item.href)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.name}>
                              {item.icon && (
                                <item.icon
                                  onClick={() => router.push(item.href)}
                                />
                              )}
                              <span>{item.name}</span>
                              <ChevronDown className="ml-auto transition-transform duration-200 data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children?.map((child) => (
                                <SidebarMenuSubItem key={child.name}>
                                  <SidebarMenuSubButton
                                    asChild
                                    className={cn(
                                      pathname === child.href &&
                                        "bg-sidebar-accent text-sidebar-accent-foreground"
                                    )}
                                  >
                                    <Link href={child.href}>
                                      <child.icon />
                                      <span>{child.name}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuButton
                      key={item.name}
                      tooltip={item.name}
                      className={cn(
                        pathname.startsWith(item.href) &&
                          "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      asChild
                    >
                      <Link href={item.href}>
                        {item.icon && <item.icon />}
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  );
                })}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavUser() {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size={"lg"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border"
            >
              <Avatar>
                {session?.user?.image && (
                  <AvatarImage
                    src={session.user.image}
                    alt={session.user.name}
                  />
                )}
                <AvatarFallback className="rounded-lg">
                  {session?.user?.name?.split(" ")[0][0]}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {session?.user.name && (
                  <span className="truncate font-medium">
                    {session?.user.name}
                  </span>
                )}
                {session?.user.email && (
                  <span className="truncate text-xs">{session.user.email}</span>
                )}
              </div>
              <ChevronsUpDown className="size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={"right"}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Avatar>
                  {session?.user?.image && (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {session?.user?.name?.split(" ")[0][0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  {session?.user.name && (
                    <span className="truncate font-medium">
                      {session?.user.name}
                    </span>
                  )}
                  {session?.user.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => handleLogout()}
                className="cursor-pointer"
                variant="destructive"
              >
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function OrgMenu() {
  const { isMobile } = useSidebar();
  const [organizationActive, setOrganizationActive] =
    useState<ActiveOrganization | null>();
  const { data: organizations } = authClient.useListOrganizations();
  const router = useRouter();

  const selectedOrganization = async (data: {
    orgId: string;
    orgSlug: string;
  }) => {
    const { data: organization, error } =
      await authClient.organization.setActive({
        organizationId: data.orgId,
        organizationSlug: data.orgSlug,
      });

    if (error) {
      toast.error("Erro ao tentar trocar de empresa!");
    }

    setOrganizationActive(organization);
    toast.success("Sucesso!");

    router.refresh();
  };

  useEffect(() => {
    const getCurrentOrg = async () => {
      const { data, error } =
        await authClient.organization.getFullOrganization();
      if (!error && data) {
        setOrganizationActive(data);
      }
    };
    getCurrentOrg();
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              {organizationActive?.logo ? (
                <Image
                  src={organizationActive.logo}
                  width={32}
                  height={32}
                  alt="Logo"
                  className="size-8 aspect-square rounded-lg"
                />
              ) : (
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                {organizationActive?.name ? (
                  <span className="truncate font-medium">
                    {organizationActive.name}
                  </span>
                ) : (
                  <span className="truncate font-medium">Nenhuma empresa</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Empresas
            </DropdownMenuLabel>
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.name}
                className="gap-2 p-2 cursor-pointer"
                onClick={() =>
                  selectedOrganization({ orgId: org.id, orgSlug: org.slug })
                }
              >
                <div className="flex size-6 items-center justify-center rounded-md border overflow-hidden">
                  {org.logo ? (
                    <Image
                      src={org.logo}
                      alt={org.name}
                      width={16}
                      height={16}
                      className="size-6"
                    />
                  ) : (
                    <Building className="size-4" />
                  )}
                </div>
                {org.name}
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem className="gap-2 p-2 cursor-pointer" asChild>
              <Link href="/create-organization">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Adicionar empresa
                </div>
              </Link>
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
