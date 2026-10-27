import { Alert, Box, Paper, Stack, TextField, Typography } from "@mui/material";
import { useId, useState } from "react";

import { architectureTopics, type ArchitectureTopic } from "./architectureExamples";

export type ArchitectureExampleProps = Readonly<{
  topic: ArchitectureTopic;
  initialCase: string;
}>;

/** Ordinary-flow, read-only architecture walkthrough; theme changes preserve the selected case. */
export function ArchitectureExample(props: ArchitectureExampleProps) {
  return <ArchitectureSession key={`${props.topic}:${props.initialCase}`} {...props} />;
}

function ArchitectureSession({ topic, initialCase }: ArchitectureExampleProps) {
  const definition = architectureTopics[topic];
  const [selectedId, setSelectedId] = useState(initialCase);
  const selectedCase = definition.cases.find(candidate => candidate.id === selectedId) ?? definition.cases[0]!;
  const selectorId = useId();

  return (
    <Box
      component="main"
      sx={{ mx: "auto", maxWidth: "lg", minWidth: 0, overflowWrap: "anywhere", p: { xs: 2, sm: 3 } }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            {definition.title}
          </Typography>
          <Typography color="text.secondary">{definition.summary}</Typography>
        </Stack>
        <Alert severity="info">
          Source-backed walkthrough. Examples are inert excerpts, not complete application modules or a live
          architecture checker. Repository paths identify the implementation to inspect; open Docs for the full tutorial
          and source references.
        </Alert>
        <TextField
          fullWidth
          id={selectorId}
          label="Architecture case"
          onChange={event => setSelectedId(event.target.value)}
          select
          slotProps={{ select: { native: true } }}
          value={selectedCase.id}
        >
          {definition.cases.map(candidate => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.label}
            </option>
          ))}
        </TextField>
        <Paper component="section" sx={{ minWidth: 0, p: { xs: 2, sm: 3 } }} variant="outlined">
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <Typography color="text.secondary">{selectedCase.question}</Typography>
            <Typography component="h2" variant="h6">
              {selectedCase.decision}
            </Typography>
            <Typography>{selectedCase.rationale}</Typography>
            <Typography component="h3" variant="subtitle1">
              {topic === "dependency-direction" ? "Source dependency map" : "Ownership and lifetime map"}
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 3 }}>
              {selectedCase.diagram.map(step => (
                <Box component="li" key={step} sx={{ mb: 1 }}>
                  {step}
                </Box>
              ))}
            </Box>
            <Typography component="h3" variant="subtitle1">
              Files and their responsibilities
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {selectedCase.files.map(file => (
                <Box component="li" key={file.path} sx={{ mb: 2 }}>
                  <Box component="code" sx={{ fontSize: "0.875rem" }}>
                    {file.path}
                  </Box>
                  <Typography variant="body2">{file.role}</Typography>
                </Box>
              ))}
            </Box>
            <Typography component="h3" variant="subtitle1">
              {selectedCase.snippet.title}
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: "action.hover",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                fontSize: "0.8125rem",
                m: 0,
                minWidth: 0,
                overflowWrap: "anywhere",
                p: 2,
                whiteSpace: "pre-wrap",
              }}
            >
              <code className={`language-${selectedCase.snippet.language}`}>{selectedCase.snippet.code}</code>
            </Box>
            <Typography component="h3" variant="subtitle1">
              Review checkpoints
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {selectedCase.pitfalls.map(pitfall => (
                <Box component="li" key={pitfall} sx={{ mb: 1 }}>
                  {pitfall}
                </Box>
              ))}
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
