import type { SvgIconComponent } from "@mui/icons-material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { Box, ButtonBase, Divider, Paper, Stack, Typography } from "@mui/material";
import { useId, type ReactNode } from "react";
import { Link } from "react-router";

export type AppCategoryListItem = Readonly<{
  id: string;
  label: string;
  description?: string;
  to: string;
  Icon: SvgIconComponent;
}>;

export type AppCategoryListGroup = Readonly<{
  id: string;
  label: string;
  description?: string;
  items: readonly AppCategoryListItem[];
}>;

export type AppCategoryListEntry = AppCategoryListItem | AppCategoryListGroup;

/** Ordered navigation links, optionally collected into named groups. */
export function AppCategoryList({
  title,
  description,
  navigationLabel,
  items,
  headerAction,
}: Readonly<{
  title: string;
  description?: string;
  navigationLabel: string;
  items: readonly AppCategoryListEntry[];
  headerAction?: ReactNode;
}>) {
  const id = useId();
  const renderItem = (item: AppCategoryListItem, groupId?: string) => {
    const itemId = `${id}-${groupId ? `${groupId}-` : ""}${item.id}`;
    return (
      <ButtonBase
        aria-describedby={item.description ? `${itemId}-description` : undefined}
        aria-labelledby={`${itemId}-title`}
        component={Link}
        key={item.id}
        sx={{
          gap: 2,
          justifyContent: "flex-start",
          minWidth: 0,
          p: { xs: 2, sm: 3 },
          pl: groupId ? { xs: 4, sm: 5 } : undefined,
          textAlign: "start",
          width: "100%",
          "&:hover": { bgcolor: "action.hover" },
          "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
        }}
        to={item.to}
      >
        <item.Icon color="action" sx={{ alignSelf: "flex-start", flexShrink: 0, mt: 0.5 }} />
        <Box sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
          <Typography component="span" id={`${itemId}-title`} sx={{ display: "block", fontWeight: 700 }} variant="h6">
            {item.label}
          </Typography>
          {item.description ? (
            <Typography
              color="text.secondary"
              component="span"
              id={`${itemId}-description`}
              sx={{ display: "block", mt: 0.5 }}
            >
              {item.description}
            </Typography>
          ) : null}
        </Box>
        <ArrowForwardOutlinedIcon color="action" fontSize="small" sx={{ flexShrink: 0 }} />
      </ButtonBase>
    );
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}
      >
        <Box sx={{ flex: "1 1 20rem", minWidth: 0 }}>
          <Typography color="text.primary" component="h2" sx={{ fontWeight: 750 }} variant="h4">
            {title}
          </Typography>
          {description ? (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {headerAction ? <Box sx={{ minWidth: 0 }}>{headerAction}</Box> : null}
      </Box>
      <Paper sx={{ minWidth: 0, overflow: "hidden" }} variant="outlined">
        <Stack aria-label={navigationLabel} component="nav" divider={<Divider />}>
          {items.map(entry =>
            "items" in entry ? (
              <Box aria-labelledby={`${id}-${entry.id}-group`} component="section" key={entry.id}>
                <Box sx={{ bgcolor: "action.hover", px: { xs: 2, sm: 3 }, py: 1.25 }}>
                  <Typography
                    color="text.secondary"
                    component="h3"
                    id={`${id}-${entry.id}-group`}
                    sx={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em" }}
                    variant="overline"
                  >
                    {entry.label}
                  </Typography>
                  {entry.description ? (
                    <Typography color="text.secondary" variant="body2">
                      {entry.description}
                    </Typography>
                  ) : null}
                </Box>
                <Divider />
                <Stack divider={<Divider />}>{entry.items.map(item => renderItem(item, entry.id))}</Stack>
              </Box>
            ) : (
              renderItem(entry)
            ),
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
