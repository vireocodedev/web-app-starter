import { Stack, Typography } from "@mui/material";
import { EstimateControls } from "../EstimateControls";
import { sigEstimateHourlyRate, sigEstimateHours } from "../../signals/estimate/sigEstimate";

export function StorageContractPreview() {
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <EstimateControls />
      <Typography color="text.secondary" sx={{ overflowWrap: "anywhere", textAlign: "center" }} variant="body2">
        {JSON.stringify({
          hourlyRate: sigEstimateHourlyRate.value,
          hours: sigEstimateHours.value,
        })}
      </Typography>
    </Stack>
  );
}
