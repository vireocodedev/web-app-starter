export type LookupDepartment = "engineering" | "operations";

export type LookupPerson = Readonly<{
  id: string;
  label: string;
  department: LookupDepartment;
}>;

export type LookupFilters = Readonly<{
  department?: LookupDepartment;
  search: string;
}>;

export const lookupPeople: readonly LookupPerson[] = [
  { id: "ada", label: "Ada Lovelace", department: "engineering" },
  { id: "grace", label: "Grace Hopper", department: "engineering" },
  { id: "lin", label: "Lin Lanying", department: "operations" },
  { id: "katherine", label: "Katherine Johnson", department: "operations" },
];

export function isLookupAssigneeValid(department: string, assigneeId: string | null) {
  return lookupPeople.some(person => person.id === assigneeId && person.department === department);
}
