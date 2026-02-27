import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  LayoutDashboard, 
  Building2, 
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Skull,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/estabelecimentos", label: "Estabelecimentos", icon: Building2, end: false },
  { to: "/admin/admins", label: "Administradores", icon: Users, end: false },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, end: false },
  { to: "/admin/danger-zone", label: "Danger Zone", icon: Skull, end: false, danger: true },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[10px] font-mono font-bold tracking-widest bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded uppercase">Super Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out flex flex-col",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="hidden lg:flex h-14 items-center px-5 border-b border-border gap-3">
          <Logo size="sm" />
          <span className="text-[10px] font-mono font-bold tracking-widest bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded uppercase">Super Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 pt-16 lg:pt-3 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  item.danger
                    ? isActive
                      ? "bg-destructive text-destructive-foreground"
                      : "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                    : isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
              <ArrowLeft size={14} />
              Voltar ao meu Estabelecimento
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-muted-foreground" onClick={handleSignOut}>
            <LogOut size={14} />
            Sair
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
