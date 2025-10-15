import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Users,
  BookMarked,
  LayoutDashboard,
  Settings,
  Package,
  CreditCard,
  Truck,
  Library,
  History,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Users", url: "/admin/users", icon: Users },
        { title: "Books", url: "/admin/books", icon: BookOpen },
        { title: "Borrow Records", url: "/admin/borrows", icon: BookMarked },
        { title: "Services", url: "/admin/services", icon: Package },
        { title: "Settings", url: "/admin/settings", icon: Settings },
      ];
    }

    if (user?.role === "librarian") {
      return [
        {
          title: "Dashboard",
          url: "/librarian/dashboard",
          icon: LayoutDashboard,
        },
        { title: "Users", url: "/librarian/users", icon: Users },
        { title: "Book Copies", url: "/librarian/copies", icon: Library },
        {
          title: "Borrow Records",
          url: "/librarian/borrows",
          icon: BookMarked,
        },
      ];
    }

    return [
      { title: "Browse Books", url: "/member/browse", icon: BookOpen },
      { title: "My Borrows", url: "/member/borrows", icon: BookMarked },
      // { title: "History", url: "/member/history", icon: History },
    ];
  };

  const navItems = getNavItems();

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Library className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              LibraryMS
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Microservices</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/services/payment")}
                  >
                    <Link to="/admin/services/payment">
                      <CreditCard className="h-4 w-4" />
                      {!collapsed && <span>Payment</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/services/delivery")}
                  >
                    <Link to="/admin/services/delivery">
                      <Truck className="h-4 w-4" />
                      {!collapsed && <span>Delivery</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
