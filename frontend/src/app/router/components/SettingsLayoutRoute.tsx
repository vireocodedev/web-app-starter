import { UserAvatar } from "@/app/auth/components/UserAvatar";
import { useAppAuth } from "@/app/auth/hooks/useAppAuth";
import { SettingsLayoutPage } from "@/pages/settings/SettingsPage";

/** Adapts authenticated account identity to the shared Settings layout. */
export function SettingsLayoutRoute() {
  const { user } = useAppAuth();
  return (
    <SettingsLayoutPage
      account={
        user
          ? {
              avatar: <UserAvatar name={user.displayName} size={56} />,
              displayName: user.displayName,
              email: user.email,
            }
          : null
      }
    />
  );
}
