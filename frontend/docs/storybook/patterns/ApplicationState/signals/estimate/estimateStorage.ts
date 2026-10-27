import { defaultEstimate } from "./sigEstimate.model";

/** One private memory slot for these teaching previews; never application storage. */
let savedEstimate: { hours: number; hourlyRate: number } = { ...defaultEstimate };
export const estimateStorage = {
  read: () => ({ ...savedEstimate }),
  write: (value: { hours: number; hourlyRate: number }) => {
    savedEstimate = { ...value };
  },
  reset: () => {
    savedEstimate = { ...defaultEstimate };
  },
};
