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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserEstablishment } from "@/hooks/useUserEstablishment";
import { cn } from "@/lib/utils";
import { useState } from "react";

const adminNavItems = [
  { to: "/admin", label: "Visão Geral", icon: LayoutDashboard, end: true },
  { to: "/admin/estabelecimentos", label: "Estabelecimentos", icon: Building2 },
  { to: "/admin/configuracoes", label: "Configurações SaaS", icon: Settings },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { data: establishment } = useUserEstablishment();
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
          <span className="text-xs font-mono font-semibold bg-destructive/10 text-destructive px-2 py-0.5 rounded">ADMIN</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex h-14 items-center px-5 border-b border-border gap-2">
            <Logo size="sm" />
            <span className="text-xs font-mono font-semibold bg-destructive/10 text-destructive px-2 py-0.5 rounded">ADMIN</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 pt-16 lg:pt-3 space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
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
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleSignOut}>
              <LogOut size={14} />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
