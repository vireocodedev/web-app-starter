export type ServerDataRecordStatus = "active" | "paused";

export type ServerDataRecord = Readonly<{
  id: string;
  name: string;
  status: ServerDataRecordStatus;
}>;

export type ServerDataPage = Readonly<{
  items: readonly ServerDataRecord[];
  page: number;
  pageSize: number;
  total: number;
}>;
