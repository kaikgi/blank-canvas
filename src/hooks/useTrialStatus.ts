import { useUserEstablishment } from './useUserEstablishment';
import { useSubscription } from './useSubscription';

export function useTrialStatus() {
  const { data: establishment, isLoading: isLoadingEst } = useUserEstablishment();
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();

  const isLoading = isLoadingEst || isLoadingSub;

  if (isLoading) {
    return { isBlocked: false, isLoading: true, daysLeft: 0, reason: '', trialEndsAt: null };
  }

  // Fail-safe: no establishment found = blocked
  if (!establishment) {
    return { isBlocked: true, isLoading: false, daysLeft: 0, reason: 'no_establishment', trialEndsAt: null };
  }

  const est = establishment as any;

  // If user has active subscription, never blocked
  if (subscription?.status === 'active') {
    return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '', trialEndsAt: null };
  }

  // If establishment status is 'active', it's paid — never blocked
  if (est.status === 'active') {
    return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '', trialEndsAt: null };
  }

  // Block if past_due or canceled
  if (est.status === 'past_due' || est.status === 'canceled') {
    return { isBlocked: true, isLoading: false, daysLeft: 0, reason: est.status, trialEndsAt: null };
  }

  // Check trial expiration ONLY when status === 'trial'
  if (est.status === 'trial') {
    const trialEndsAt = est.trial_ends_at;
    if (!trialEndsAt) {
      return { isBlocked: false, isLoading: false, daysLeft: 7, reason: '', trialEndsAt: null };
    }

    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (now > trialEnd) {
      return { isBlocked: true, isLoading: false, daysLeft: 0, reason: 'trial_expired', trialEndsAt: trialEndsAt };
    }

    return { isBlocked: false, isLoading: false, daysLeft: Math.max(0, daysLeft), reason: '', trialEndsAt: trialEndsAt };
  }

  // Any other status: not blocked
  return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '', trialEndsAt: null };
}
