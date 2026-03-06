/**
 * @deprecated Trial has been removed. Use useSubscription() directly.
 * This file is kept temporarily for backward compatibility.
 */
import { useUserEstablishment } from './useUserEstablishment';
import { useSubscription } from './useSubscription';

export function useTrialStatus() {
  const { data: establishment, isLoading: isLoadingEst } = useUserEstablishment();
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();

  const isLoading = isLoadingEst || isLoadingSub;

  if (isLoading) {
    return { isBlocked: false, isLoading: true, daysLeft: 0, reason: '', trialEndsAt: null };
  }

  if (!establishment) {
    return { isBlocked: true, isLoading: false, daysLeft: 0, reason: 'no_establishment', trialEndsAt: null };
  }

  const est = establishment as any;

  // Active subscription = not blocked
  if (subscription?.status === 'active' || est.status === 'active') {
    return { isBlocked: false, isLoading: false, daysLeft: 0, reason: '', trialEndsAt: null };
  }

  // Block if past_due or canceled
  if (est.status === 'past_due' || est.status === 'canceled') {
    return { isBlocked: true, isLoading: false, daysLeft: 0, reason: est.status, trialEndsAt: null };
  }

  // Any other status without active subscription = blocked
  return { isBlocked: true, isLoading: false, daysLeft: 0, reason: 'no_subscription', trialEndsAt: null };
}
