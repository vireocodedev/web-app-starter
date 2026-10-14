import { Box, Link, Stack, Typography } from "@mui/material";
import { createPortal } from "react-dom";

import { useDocumentationRail } from "./documentationRail";

export type DocumentationContentsItem = Readonly<{
  id: string;
  title: string;
}>;

export function DocumentationContents({
  items,
  label,
  title,
}: Readonly<{
  items: readonly DocumentationContentsItem[];
  label: string;
  title: string;
}>) {
  const rail = useDocumentationRail();
  const contents = (
    <Box aria-label={label} component="nav">
      <Typography component="h2" sx={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.4 }} variant="subtitle2">
        {title}
      </Typography>
      <Stack component="ol" spacing={0.125} sx={{ listStylePosition: "inside", mb: 0, mt: 0.75, pl: 0 }}>
        {items.map(item => (
          <Box component="li" key={item.id} sx={{ fontSize: "0.8125rem", lineHeight: 1.35, py: 0.375 }}>
            <Link href={`#${item.id}`} sx={{ fontSize: "inherit", lineHeight: "inherit" }} underline="hover">
              {item.title}
            </Link>
          </Box>
        ))}
      </Stack>
    </Box>
  );

  return rail?.contentsTarget ? createPortal(contents, rail.contentsTarget) : contents;
}
