import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { ToggleButtonGroupProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactNode, Ref } from "react";

export type AppChoiceToggleValue = string | number | boolean;

/** Option values must be unique within the group. Icons are decorative and noninteractive. */
export type AppChoiceToggleOption<T extends AppChoiceToggleValue> = Readonly<{
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}>;

type OwnedGroupProp =
  "children" | "exclusive" | "value" | "onChange" | "defaultValue" | "role" | "dangerouslySetInnerHTML";

type AccessibleGroupName =
  { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string };

export type AppSingleChoiceToggleGroupProps<
  T extends AppChoiceToggleValue,
  AllowDeselect extends boolean = false,
> = Omit<ToggleButtonGroupProps, OwnedGroupProp | "aria-label" | "aria-labelledby"> &
  AccessibleGroupName &
  Readonly<{
    options: readonly AppChoiceToggleOption<T>[];
    value: NoInfer<T> | null;
    allowDeselect?: AllowDeselect;
    onChange: (value: NoInfer<AllowDeselect extends false ? T : T | null>, event: MouseEvent<HTMLElement>) => void;
    ref?: Ref<HTMLDivElement>;
    children?: never;
    exclusive?: never;
    defaultValue?: never;
    role?: never;
    dangerouslySetInnerHTML?: never;
  }>;

/**
 * Controlled single choice using MUI's pressed-button and roving-focus behavior.
 * A null value can represent an unanswered field independently of allowDeselect.
 * The caller owns reconciliation when options are removed, disabled, or empty.
 */
export function AppSingleChoiceToggleGroup<
  const Options extends readonly AppChoiceToggleOption<AppChoiceToggleValue>[],
  AllowDeselect extends boolean = false,
>({
  allowDeselect,
  disabled,
  onChange,
  options,
  ref,
  value,
  ...groupProps
}: Omit<
  AppSingleChoiceToggleGroupProps<Options[number]["value"], AllowDeselect>,
  "options" | "aria-label" | "aria-labelledby"
> &
  AccessibleGroupName &
  Readonly<{ options: Options }>) {
  type Value = Options[number]["value"];
  return (
    <ToggleButtonGroup
      {...groupProps}
      disabled={disabled}
      exclusive
      onChange={(event, nextValue: Value | null) => {
        if (nextValue === null && !allowDeselect) return;
        // MUI produces an option value or null; the guard implements the callback's nullability contract.
        onChange(nextValue as AllowDeselect extends false ? Value : Value | null, event);
      }}
      ref={ref}
      role="group"
      value={value}
    >
      {options.map(option => (
        <ToggleButton
          aria-label={option.ariaLabel ?? option.label}
          disabled={disabled || option.disabled}
          key={`${typeof option.value}:${String(option.value)}`}
          sx={[{ gap: 1 }, ...(option.sx ? (Array.isArray(option.sx) ? option.sx : [option.sx]) : [])]}
          value={option.value}
        >
          {option.icon != null ? (
            <Box
              aria-hidden="true"
              component="span"
              data-app-choice-icon
              inert
              sx={{ display: "flex", flex: "0 0 auto", pointerEvents: "none" }}
            >
              {option.icon}
            </Box>
          ) : null}
          <Box component="span" data-app-choice-label sx={{ minWidth: 0 }} title={option.label}>
            {option.label}
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
