import { useUserEstablishment } from './useUserEstablishment';
import { useSubscription } from './useSubscription';

export function useTrialStatus() {
  const { data: establishment, isLoading: isLoadingEst } = useUserEstablishment();
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();

  const isLoading = isLoadingEst || isLoadingSub;

  if (isLoading || !establishment) {
    return { isBlocked: false, isLoading, daysLeft: 0, reason: '' };
  }

  const est = establishment as any;

  // If user has active subscription, never blocked
  if (subscription?.status === 'active') {
    return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '' };
  }

  // If establishment status is 'active', it's paid — never blocked
  if (est.status === 'active') {
    return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '' };
  }

  // Block if past_due or canceled
  if (est.status === 'past_due' || est.status === 'canceled') {
    return { isBlocked: true, isLoading: false, daysLeft: 0, reason: est.status };
  }

  // Check trial expiration ONLY when status === 'trial'
  if (est.status === 'trial') {
    const trialEndsAt = est.trial_ends_at;
    if (!trialEndsAt) {
      // No trial_ends_at set — assume 7 days left, NOT blocked
      return { isBlocked: false, isLoading: false, daysLeft: 7, reason: '' };
    }

    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Block ONLY if current date > trial_ends_at
    if (now > trialEnd) {
      return { isBlocked: true, isLoading: false, daysLeft: 0, reason: 'trial_expired' };
    }

    return { isBlocked: false, isLoading: false, daysLeft: Math.max(0, daysLeft), reason: '' };
  }

  // Any other status: not blocked
  return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '' };
}
