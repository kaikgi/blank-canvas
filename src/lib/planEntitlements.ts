export interface PlanEntitlements {
  planLabel: string;
  professionalLimit: number;
  appointmentLimit: number;
}

/**
 * Centralized entitlements for each plan/status.
 * Trial: 3 professionals, 130 appointments.
 * Paid plans: unlimited appointments, varying professional limits.
 */
export function getPlanEntitlements(
  status: string | undefined | null,
  plano: string | undefined | null,
  trialEndsAt: string | null | undefined,
): PlanEntitlements {
  const normalizedStatus = (status || '').toLowerCase();
  const normalizedPlano = (plano || '').toLowerCase();

  // Trial (active trial)
  if (normalizedStatus === 'trial') {
    return {
      planLabel: 'Trial',
      professionalLimit: 3,
      appointmentLimit: 130,
    };
  }

  // Active paid plans
  if (normalizedStatus === 'active' || normalizedStatus === '') {
    switch (normalizedPlano) {
      case 'studio':
        return { planLabel: 'Studio', professionalLimit: Infinity, appointmentLimit: Infinity };
      case 'essencial':
        return { planLabel: 'Essencial', professionalLimit: 4, appointmentLimit: Infinity };
      case 'basico':
      default:
        return { planLabel: 'Básico', professionalLimit: 1, appointmentLimit: Infinity };
    }
  }

  // past_due, canceled, or unknown — fallback to most restrictive
  return { planLabel: 'Sem plano', professionalLimit: 0, appointmentLimit: 0 };
}

/** Format limit for display: Infinity -> "Ilimitados", number -> number */
export function formatLimit(limit: number): string {
  return limit === Infinity ? 'Ilimitados' : String(limit);
}
