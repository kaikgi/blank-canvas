import { useUserEstablishment } from './useUserEstablishment';
import { useSubscription } from './useSubscription';

export function useTrialStatus() {
  const { data: establishment, isLoading: isLoadingEst } = useUserEstablishment();
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();

  const isLoading = isLoadingEst || isLoadingSub;

  if (isLoading || !establishment) {
    return { isTrialExpired: false, isLoading, daysLeft: 0 };
  }

  // If user has active subscription, trial doesn't matter
  if (subscription?.status === 'active') {
    return { isTrialExpired: false, isLoading: false, daysLeft: 0 };
  }

  // If establishment status is 'active', it's paid
  if ((establishment as any).status === 'active') {
    return { isTrialExpired: false, isLoading: false, daysLeft: 0 };
  }

  // Check trial expiration
  const trialEndsAt = (establishment as any).trial_ends_at;
  if (!trialEndsAt) {
    return { isTrialExpired: false, isLoading: false, daysLeft: 7 };
  }

  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isTrialExpired: now > trialEnd,
    isLoading: false,
    daysLeft: Math.max(0, daysLeft),
  };
}
