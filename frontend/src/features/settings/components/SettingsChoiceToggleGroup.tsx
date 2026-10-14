import { AppSingleChoiceToggleGroup } from "@/app/forms/components/AppSingleChoiceToggleGroup";
import type {
  AppChoiceToggleValue,
  AppSingleChoiceToggleGroupProps,
} from "@/app/forms/components/AppSingleChoiceToggleGroup";

import { settingsChoiceToggleGroupSx } from "./settingsChoiceToggleGroupSx";

export function SettingsChoiceToggleGroup<const T extends AppChoiceToggleValue>({
  sx,
  ...props
}: AppSingleChoiceToggleGroupProps<T>) {
  return (
    <AppSingleChoiceToggleGroup
      {...props}
      size="small"
      sx={[settingsChoiceToggleGroupSx, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}
    />
  );
}
