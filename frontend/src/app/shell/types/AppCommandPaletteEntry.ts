/** Localized page destinations supplied by router composition to the shell. */
export type AppCommandPaletteEntry = Readonly<{
  context: string;
  id: string;
  label: string;
  to: string;
}>;
