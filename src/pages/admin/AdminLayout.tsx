import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  LayoutDashboard, 
  Building2, 
  MessageSquare, 
  Users, 
  CreditCard,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Skull,
  ScrollText,
  BarChart3,
  MailCheck,
  Webhook,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserEstablishment } from "@/hooks/useUserEstablishment";
import { cn } from "@/lib/utils";
import { useState } from "react";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/estabelecimentos", label: "Estabelecimentos", icon: Building2 },
  { to: "/admin/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { to: "/admin/admins", label: "Administradores", icon: Users },
  { to: "/admin/whatsapp", label: "WhatsApp Analytics", icon: BarChart3 },
  { to: "/admin/emails-autorizados", label: "Emails Autorizados", icon: MailCheck },
  { to: "/admin/webhooks", label: "Kiwify Webhooks", icon: Webhook },
  { to: "/admin/auditoria", label: "Auditoria", icon: ScrollText },
  { to: "/admin/danger-zone", label: "Danger Zone", icon: Skull },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { data: establishment } = useUserEstablishment();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasEstablishment = !!establishment;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <Logo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex h-16 items-center px-6 border-b border-border">
            <Logo size="sm" />
            <span className="ml-2 text-sm font-semibold text-primary">Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 pt-20 lg:pt-4 space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
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
          <div className="p-4 border-t border-border space-y-2">
            {hasEstablishment && (
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowLeft size={18} />
                  Voltar ao Dashboard
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
