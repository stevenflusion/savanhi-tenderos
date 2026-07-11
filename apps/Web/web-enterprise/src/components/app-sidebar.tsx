"use client";

import {
  Building2,
  LayoutDashboard,
  Megaphone,
  Settings2,
  ShoppingCart,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/presentation/components/auth/auth-provider";
import { usePendingPaymentsCount } from "@/presentation/hooks/use-pending-payments-count";

const adminNav = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Marcas",
    url: "#",
    icon: Building2,
    items: [
      { title: "Todas las marcas", url: "#" },
      { title: "Registrar marca", url: "/admin/brands/new" },
    ],
  },
  {
    title: "Campañas",
    url: "#",
    icon: Megaphone,
    items: [
      { title: "Todas las campañas", url: "#" },
    ],
  },
  {
    title: "Pagos pendientes",
    url: "/admin/payments",
    icon: ShoppingCart,
  },
  {
    title: "Configuración",
    url: "#",
    icon: Settings2,
    items: [
      { title: "General", url: "#" },
    ],
  },
];

const brandNav = [
  {
    title: "Dashboard",
    url: "/brand/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Campañas",
    url: "/brand/dashboard",
    icon: Megaphone,
    items: [
      { title: "Mis campañas", url: "/brand/dashboard" },
      { title: "Nueva campaña", url: "/brand/campaigns/new" },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const pendingPaymentsCount = usePendingPaymentsCount();

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const navItems = isAdmin ? adminNav : brandNav;

  // Inject badge for admin "Pagos pendientes" item
  const activeNav = navItems.map((item) => {
    const isPaymentsItem =
      isAdmin && item.title === "Pagos pendientes";

    return {
      ...item,
      badge: isPaymentsItem && pendingPaymentsCount > 0
        ? pendingPaymentsCount
        : undefined,
      isActive: false, // will be set by NavMain based on pathname
    };
  });

  return (
    <Sidebar className="h-dvh" collapsible="none" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="w-60 pl-2">
        <NavMain items={activeNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
