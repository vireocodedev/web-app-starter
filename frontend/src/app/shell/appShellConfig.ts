export type AppDrawerMode = "temporary" | "permanent";
export type AppHeaderStickiness = "first-row" | "both-rows" | "none";

/** Application-owned defaults used when the user has no saved preference. */
export const appShellConfig = {
  drawerMode: "temporary",
  headerStickiness: "first-row",
  permanentDrawerOpen: true,
  permanentDrawerCollapsed: false,
  permanentDrawerWidth: 330,
  collapsedDrawerWidth: 72,
} satisfies Readonly<{
  drawerMode: AppDrawerMode;
  headerStickiness: AppHeaderStickiness;
  permanentDrawerOpen: boolean;
  permanentDrawerCollapsed: boolean;
  permanentDrawerWidth: number;
  collapsedDrawerWidth: number;
}>;
