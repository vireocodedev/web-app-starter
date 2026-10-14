import type { ReactNode } from "react";

export type AppSettingsRowDefinition = Readonly<{
  control: ReactNode;
  description?: string;
  id: string;
  title: string;
}>;

export type AppSettingsSectionDefinition = Readonly<{
  id: string;
  rows: readonly AppSettingsRowDefinition[];
  title: string;
}>;
