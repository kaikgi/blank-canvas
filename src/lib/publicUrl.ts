/**
 * Single source of truth for public URL generation.
 * Used across the entire application.
 * 
 * IMPORTANT: Always use these functions to ensure links work in production.
 */

// Production base URL - the canonical domain for public links
const PRODUCTION_DOMAIN = 'www.agendali.online';

/**
 * Returns the production base URL (always agendali.online).
 * For critical redirects, ALWAYS use this to avoid supabase.co or lovable.app
 */
export function getProductionUrl(): string {
  return `https://${PRODUCTION_DOMAIN}`;
}

/**
 * Builds a public URL by appending a path to the base URL.
 * Handles path normalization to avoid double slashes.
 * @param path - The path to append (with or without leading slash)
 * @returns The full public URL
 */
export function buildPublicUrl(path: string): string {
  const baseUrl = getPublicBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Generates the public booking URL for an establishment.
 * @param slug - The establishment's unique slug
 * @returns The full public URL for the establishment's booking page
 */
export function getPublicUrl(slug: string): string {
  return `${getPublicBaseUrl()}/${slug}`;
}

/**
 * Generates the appointment management URL.
 * @param slug - The establishment's unique slug
 * @param token - The management token
 * @returns The full URL for managing the appointment
 */
export function getManageAppointmentUrl(slug: string, token: string): string {
  return `${getPublicBaseUrl()}/${slug}/gerenciar/${token}`;
}

/**
 * Generates the professional portal URL.
 * @param establishmentSlug - The establishment's unique slug
 * @param professionalSlug - The professional's unique slug
 * @returns The full public URL for the professional's portal login
 */
export function getProfessionalPortalUrl(establishmentSlug: string, professionalSlug: string): string {
  return `${getPublicBaseUrl()}/${establishmentSlug}/p/${professionalSlug}`;
}

/**
 * Generates the client appointments page URL.
 * @returns The full public URL for the client's appointments page
 */
export function getClientAppointmentsUrl(): string {
  return `${getPublicBaseUrl()}/client/appointments`;
}
