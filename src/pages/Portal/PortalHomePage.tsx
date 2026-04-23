import { getSubdomainSlug } from '../../utils/tenant';
import LandingPage from './LandingPage';
import PublicBookingPage from './PublicBookingPage';

/**
 * Root `/` route. When visited on a tenant subdomain (e.g. acme.smallservicebusiness.com)
 * we show the public booking flow for that business. On the base domain we show the
 * marketing landing page for SaaS signups.
 *
 * `?org=<slug>` is supported in dev where wildcard subdomains aren't available.
 */
export default function PortalHomePage() {
  const slugFromSubdomain = getSubdomainSlug();
  const slugFromQuery = new URLSearchParams(window.location.search).get('org');
  const isTenantContext = !!(slugFromSubdomain || slugFromQuery);

  return isTenantContext ? <PublicBookingPage /> : <LandingPage />;
}
