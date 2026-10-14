import { RouteRecoveryBoundary, RouteRecoveryPanel } from "@/features/development-guide/patterns/routingAndUrlState";

export function RoutingRouteRecoveryPage() {
  return <RouteRecoveryPanel />;
}

export { RouteRecoveryBoundary as RoutingRouteRecoveryErrorBoundary };
