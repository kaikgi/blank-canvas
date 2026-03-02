import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { CompletionPromptDialog } from '@/components/completion/CompletionPromptDialog';
import { NotificationBell } from './NotificationBell';
import { useUserEstablishment } from '@/hooks/useUserEstablishment';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { TrialExpiredModal } from './TrialExpiredModal';
import { TrialOnboardingPopup } from './TrialOnboardingPopup';
import { TrialBanner } from './TrialBanner';

export function DashboardLayout() {
  const { data: establishment } = useUserEstablishment();
  const { isBlocked, isLoading, daysLeft } = useTrialStatus();

  const est = establishment as any;
  const isTrial = (est?.status || '').toLowerCase() === 'trial';
  const showTrialUI = isTrial && daysLeft > 0 && !isBlocked;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            <NotificationBell />
          </header>
          {showTrialUI && <TrialBanner daysLeft={daysLeft} />}
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Trial/Payment Blocked Paywall */}
      {!isLoading && isBlocked && <TrialExpiredModal />}

      {/* Trial Onboarding Popup (first visit only) */}
      {showTrialUI && <TrialOnboardingPopup daysLeft={daysLeft} />}

      {/* Completion Prompt Dialog */}
      <CompletionPromptDialog 
        establishmentId={establishment?.id} 
        userType="establishment" 
      />
    </SidebarProvider>
  );
}
