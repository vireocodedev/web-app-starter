/** Optional, non-production sign-in guidance supplied by startup composition. */
export type AppAuthLoginAssistance = Readonly<{
  password: string;
  username: string;
}>;
