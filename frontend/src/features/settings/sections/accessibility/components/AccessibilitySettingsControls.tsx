import type { AppLinkUnderlinePreference, AppMotionPreference } from "@/app/theme/themeSetup";
import { SettingsChoiceToggleGroup } from "../../../components/SettingsChoiceToggleGroup";

export function MotionPreferenceControl({
  label,
  onChange,
  reduceLabel,
  systemLabel,
  value,
}: Readonly<{
  label: string;
  onChange: (value: AppMotionPreference) => void;
  reduceLabel: string;
  systemLabel: string;
  value: AppMotionPreference;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "system", label: systemLabel },
        { value: "reduce", label: reduceLabel },
      ]}
      value={value}
    />
  );
}

export function LinkUnderlinePreferenceControl({
  alwaysLabel,
  label,
  onChange,
  pageLabel,
  value,
}: Readonly<{
  alwaysLabel: string;
  label: string;
  onChange: (value: AppLinkUnderlinePreference) => void;
  pageLabel: string;
  value: AppLinkUnderlinePreference;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "page", label: pageLabel },
        { value: "always", label: alwaysLabel },
      ]}
      value={value}
    />
  );
}
