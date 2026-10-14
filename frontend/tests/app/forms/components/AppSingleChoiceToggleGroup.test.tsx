import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { MouseEvent } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { AppSingleChoiceToggleGroup } from "@/app/forms/components/AppSingleChoiceToggleGroup";
import type {
  AppChoiceToggleOption,
  AppSingleChoiceToggleGroupProps,
} from "@/app/forms/components/AppSingleChoiceToggleGroup";

const options = [
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
] as const;

describe("AppSingleChoiceToggleGroup", () => {
  it("leaves state with the caller, preserves the originating event, and suppresses deselection by default", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <AppSingleChoiceToggleGroup aria-label="Choice" onChange={onChange} options={options} value="first" />,
    );
    await user.click(screen.getByRole("button", { name: "First" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(onChange).toHaveBeenCalledWith("second", expect.objectContaining({ type: "click" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-pressed", "true");
    rerender(<AppSingleChoiceToggleGroup aria-label="Choice" onChange={onChange} options={options} value="second" />);
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-pressed", "true");
  });

  it("supports an unanswered initial value and opt-in clearing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <AppSingleChoiceToggleGroup aria-label="Choice" onChange={onChange} options={options} value={null} />,
    );
    expect(screen.getAllByRole("button").every(button => button.getAttribute("aria-pressed") === "false")).toBe(true);
    rerender(
      <AppSingleChoiceToggleGroup
        allowDeselect
        aria-label="Choice"
        onChange={onChange}
        options={options}
        value="first"
      />,
    );
    await user.click(screen.getByRole("button", { name: "First" }));
    expect(onChange).toHaveBeenCalledWith(null, expect.objectContaining({ type: "click" }));
  });

  it("distinguishes falsy primitives and values with identical string representations", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const primitiveOptions = [
      { value: false, label: "False" },
      { value: 0, label: "Zero" },
      { value: "", label: "Empty string" },
      { value: 1, label: "Number one" },
      { value: "1", label: "String one" },
    ] as const;
    const { rerender } = render(
      <AppSingleChoiceToggleGroup
        aria-label="Primitives"
        onChange={onChange}
        options={primitiveOptions}
        value={null}
      />,
    );
    for (const option of primitiveOptions) {
      await user.click(screen.getByRole("button", { name: option.label }));
      expect(onChange).toHaveBeenLastCalledWith(option.value, expect.any(Object));
      rerender(
        <AppSingleChoiceToggleGroup
          aria-label="Primitives"
          onChange={onChange}
          options={primitiveOptions}
          value={option.value}
        />,
      );
      expect(screen.getByRole("button", { name: option.label })).toHaveAttribute("aria-pressed", "true");
    }
    expect(screen.getByRole("button", { name: "Number one" })).toHaveAttribute("aria-pressed", "false");
  });

  it("disables individual options and gives whole-group disabling precedence", () => {
    const onChange = vi.fn();
    const disabledOptions = [
      { value: "first", label: "First", disabled: false },
      { value: "second", label: "Second", disabled: true },
    ] as const;
    const { rerender } = render(
      <AppSingleChoiceToggleGroup aria-label="Choice" onChange={onChange} options={disabledOptions} value="second" />,
    );
    expect(screen.getByRole("button", { name: "Second" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <AppSingleChoiceToggleGroup
        aria-label="Choice"
        disabled
        onChange={onChange}
        options={disabledOptions}
        value="second"
      />,
    );
    expect(screen.getAllByRole("button").every(button => button.hasAttribute("disabled"))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not reconcile removed, unknown, disabled, or empty options", () => {
    const onChange = vi.fn();
    const flexibleOptions: readonly AppChoiceToggleOption<string>[] = options;
    const { rerender } = render(
      <AppSingleChoiceToggleGroup aria-label="Choice" onChange={onChange} options={flexibleOptions} value="unknown" />,
    );
    expect(screen.getAllByRole("button").every(button => button.getAttribute("aria-pressed") === "false")).toBe(true);
    rerender(
      <AppSingleChoiceToggleGroup
        aria-label="Choice"
        onChange={onChange}
        options={[{ value: "first", label: "First", disabled: true }]}
        value="first"
      />,
    );
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-pressed", "true");
    rerender(
      <AppSingleChoiceToggleGroup
        aria-label="Choice"
        onChange={onChange}
        options={flexibleOptions.filter(option => option.value !== "first")}
        value="first"
      />,
    );
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-pressed", "false");
    const emptyOptions: readonly AppChoiceToggleOption<string>[] = [];
    rerender(
      <AppSingleChoiceToggleGroup aria-label="Choice" onChange={onChange} options={emptyOptions} value="first" />,
    );
    expect(within(screen.getByRole("group", { name: "Choice" })).queryAllByRole("button")).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards the root ref, native events, names, and style customization while keeping icons decorative", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const onFocus = vi.fn();
    render(
      <>
        <h2 id="choice-heading">Named choice</h2>
        <AppSingleChoiceToggleGroup
          aria-labelledby="choice-heading"
          className="consumer-class"
          color="secondary"
          data-testid="choice"
          fullWidth
          onChange={vi.fn()}
          onFocus={onFocus}
          options={[
            {
              value: 1,
              label: "Visible text",
              ariaLabel: "Accessible choice",
              icon: <span tabIndex={0}>Icon action</span>,
              sx: [{ padding: "12px" }],
            },
          ]}
          orientation="vertical"
          ref={ref}
          size="small"
          sx={theme => ({ marginTop: theme.spacing(2) })}
          value={1}
        />
      </>,
    );
    const group = screen.getByRole("group", { name: "Named choice" });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("consumer-class", "MuiToggleButtonGroup-vertical", "MuiToggleButtonGroup-fullWidth");
    expect(group).toHaveStyle({ marginTop: "16px" });
    const button = screen.getByRole("button", { name: "Accessible choice" });
    expect(button).toHaveTextContent("Visible text");
    expect(button).toHaveStyle({ padding: "12px" });
    expect(button.querySelector("[data-app-choice-icon]")).toHaveAttribute("aria-hidden", "true");
    expect(button.querySelector("[data-app-choice-icon]")).toHaveAttribute("inert");
    expect(
      within(button.querySelector("[data-app-choice-icon]") as HTMLElement).queryByRole("button"),
    ).not.toBeInTheDocument();
    await user.tab();
    expect(onFocus).toHaveBeenCalled();
  });

  it("retains MUI roving focus, skips disabled options, and selects through Space and Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AppSingleChoiceToggleGroup
        aria-label="Keyboard choice"
        onChange={onChange}
        options={[
          ...options,
          { value: "disabled", label: "Disabled", disabled: true },
          { value: "last", label: "Last" },
        ]}
        value="first"
      />,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith("second", expect.any(Object));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("last", expect.any(Object));
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
  });

  it("preserves option inference and callback nullability in compile-time examples", () => {
    // Compile-only calls verify the component signature without running its transformed React hooks.
    const checkTypes = () => {
      const dynamicAllowDeselect = Math.random() > 0.5;
      const keep = (
        <AppSingleChoiceToggleGroup
          aria-label="Choice"
          options={options}
          value={null}
          onChange={(value, event) => {
            expectTypeOf(value).toEqualTypeOf<"first" | "second">();
            expectTypeOf(event).toEqualTypeOf<MouseEvent<HTMLElement>>();
          }}
        />
      );
      const explicitKeep = (
        <AppSingleChoiceToggleGroup
          allowDeselect={false}
          aria-label="Choice"
          options={options}
          value="first"
          onChange={value => {
            expectTypeOf(value).toEqualTypeOf<"first" | "second">();
          }}
        />
      );
      const clear = (
        <AppSingleChoiceToggleGroup
          allowDeselect
          aria-label="Choice"
          options={options}
          value="first"
          onChange={value => {
            expectTypeOf(value).toEqualTypeOf<"first" | "second" | null>();
          }}
        />
      );
      const dynamic = (
        <AppSingleChoiceToggleGroup
          allowDeselect={dynamicAllowDeselect}
          aria-label="Choice"
          options={options}
          value="first"
          onChange={value => {
            expectTypeOf(value).toEqualTypeOf<"first" | "second" | null>();
          }}
        />
      );
      expectTypeOf<AppSingleChoiceToggleGroupProps<"first", true>["onChange"]>()
        .parameter(0)
        .toEqualTypeOf<"first" | null>();
      const mixed = (
        <AppSingleChoiceToggleGroup
          aria-label="Mixed primitives"
          options={[
            { value: false, label: "False" },
            { value: 0, label: "Zero" },
            { value: "", label: "Empty" },
            { value: 1, label: "Number" },
            { value: "1", label: "String" },
          ]}
          value={false}
          onChange={value => {
            expectTypeOf(value).toEqualTypeOf<false | 0 | "" | 1 | "1">();
          }}
        />
      );
      const invalidValue = AppSingleChoiceToggleGroup({
        "aria-label": "Choice",
        options,
        // @ts-expect-error The controlled value cannot widen the options' value type.
        value: "missing",
        onChange: () => {},
      });
      const byId = AppSingleChoiceToggleGroup({
        "aria-labelledby": "choice-heading",
        options,
        value: null,
        onChange: value => {
          expectTypeOf(value).toEqualTypeOf<"first" | "second">();
        },
      });
      // @ts-expect-error The actual component requires either aria-label or aria-labelledby.
      const unnamed = AppSingleChoiceToggleGroup({ options, value: null, onChange: () => {} });
      // @ts-expect-error The exported props also require an accessible name.
      const unnamedProps: AppSingleChoiceToggleGroupProps<"first" | "second"> = {
        options,
        value: null,
        onChange: () => {},
      };
      const nonexclusive: AppSingleChoiceToggleGroupProps<"first" | "second"> = {
        "aria-label": "Choice",
        options,
        value: "first",
        onChange: () => {},
        // @ts-expect-error Consumers cannot replace exclusive selection.
        exclusive: false,
      };
      const radio: AppSingleChoiceToggleGroupProps<"first" | "second"> = {
        "aria-label": "Choice",
        options,
        value: "first",
        onChange: () => {},
        // @ts-expect-error Consumers cannot change pressed-button semantics.
        role: "radiogroup",
      };
      const unsafeCallback = AppSingleChoiceToggleGroup({
        "aria-label": "Choice",
        options,
        value: "first",
        allowDeselect: true,
        // @ts-expect-error Deselection callbacks must accept null.
        onChange: (value: "first" | "second") => {
          void value;
        },
      });
      const uncontrolled: AppSingleChoiceToggleGroupProps<"first" | "second"> = {
        "aria-label": "Choice",
        options,
        value: "first",
        onChange: () => {},
        // @ts-expect-error Controlled state excludes defaultValue.
        defaultValue: "first",
      };
      const objectValue: AppSingleChoiceToggleGroupProps<string> = {
        "aria-label": "Choice",
        value: null,
        onChange: () => {},
        // @ts-expect-error Options cannot have object values.
        options: [{ value: {}, label: "Object" }],
      };
      void [
        keep,
        explicitKeep,
        clear,
        dynamic,
        mixed,
        invalidValue,
        unnamed,
        unnamedProps,
        byId,
        nonexclusive,
        radio,
        unsafeCallback,
        uncontrolled,
        objectValue,
      ];
    };
    void checkTypes;
  });
});
