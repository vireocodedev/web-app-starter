import { Avatar } from "@mui/material";

import { avatarColor, avatarInitials } from "../utils/userAvatarIdentity";

/** Shared initials avatar for authenticated account surfaces. */
export function UserAvatar({ name, size = 32 }: Readonly<{ name: string; size?: number }>) {
  return (
    <Avatar
      sx={{
        bgcolor: avatarColor(name),
        color: "#fff",
        fontSize: size === 32 ? "0.875rem" : `${(size / 32) * 0.875}rem`,
        fontWeight: 700,
        height: size,
        width: size,
      }}
    >
      {avatarInitials(name)}
    </Avatar>
  );
}
