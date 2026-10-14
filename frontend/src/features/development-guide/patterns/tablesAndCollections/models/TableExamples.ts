export type TableExampleStatus = "active" | "paused" | "review";

export type TableExampleRecord = Readonly<{
  id: string;
  name: string;
  owner: string;
  status: TableExampleStatus;
}>;

export const tableExampleRecords: readonly TableExampleRecord[] = [
  { id: "atlas", name: "Atlas migration", owner: "Mia", status: "active" },
  { id: "beacon", name: "Beacon rollout", owner: "Noah", status: "review" },
  { id: "canal", name: "Canal inspection", owner: "Luka", status: "paused" },
  { id: "delta", name: "Delta renewal", owner: "Eva", status: "active" },
  { id: "ember", name: "Ember retrofit", owner: "Iva", status: "review" },
  { id: "fjord", name: "Fjord survey", owner: "Leo", status: "paused" },
];
