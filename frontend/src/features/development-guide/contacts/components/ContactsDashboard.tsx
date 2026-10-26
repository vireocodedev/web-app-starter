import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { useContactsFeature } from "../hooks/useContactsFeature";
import type { Contact } from "../models/Contact";
import { contactStatusSchema, type ContactStatus } from "../models/ContactStatus";

type DashboardSummary = Readonly<{
  statusCounts: Readonly<Record<ContactStatus, number>>;
  organizations: ReadonlyArray<Readonly<{ count: number; name: string }>>;
  total: number;
}>;

function summarizeContacts(contacts: readonly Contact[]): DashboardSummary {
  const organizationCounts = new Map<string, number>();
  const statusCounts = Object.fromEntries(contactStatusSchema.options.map(status => [status, 0])) as Record<
    ContactStatus,
    number
  >;

  for (const contact of contacts) {
    statusCounts[contact.status] += 1;
    organizationCounts.set(contact.organization, (organizationCounts.get(contact.organization) ?? 0) + 1);
  }

  return {
    statusCounts,
    organizations: [...organizationCounts]
      .map(([name, count]) => ({ count, name }))
      .sort((left, right) =>
        right.count === left.count ? left.name.localeCompare(right.name) : right.count - left.count,
      ),
    total: contacts.length,
  };
}

function DashboardHero() {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Paper
      sx={theme => ({
        bgcolor: "background.paper",
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 12%, transparent), transparent 70%)`,
        border: 1,
        borderColor: "divider",
        overflow: "hidden",
        p: { md: 4, xs: 3 },
        position: "relative",
      })}
    >
      <Box
        aria-hidden
        sx={theme => ({
          bgcolor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 8%, transparent)`,
          borderRadius: "50%",
          height: 220,
          position: "absolute",
          right: -70,
          top: -110,
          width: 220,
        })}
      />
      <Stack
        direction={{ sm: "row", xs: "column" }}
        sx={{
          alignItems: { sm: "center", xs: "flex-start" },
          gap: 3,
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <Stack spacing={1} sx={{ maxWidth: 680 }}>
          <Typography sx={{ color: "primary.main", fontWeight: 700 }} variant="overline">
            {t("contacts.dashboard.eyebrow")}
          </Typography>
          <Typography component="h2" variant="h3">
            {t("contacts.dashboard.title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }} variant="body1">
            {t("contacts.dashboard.description")}
          </Typography>
        </Stack>
        <Button
          component={RouterLink}
          endIcon={<ArrowForwardOutlinedIcon />}
          size="large"
          to="/dev-guide/frontend/example-pages/contacts-crud"
          variant="contained"
        >
          {t("contacts.dashboard.open")}
        </Button>
      </Stack>
    </Paper>
  );
}

function DashboardLoading() {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Box aria-label={t("contacts.dashboard.loading")}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { lg: "repeat(4, 1fr)", sm: "repeat(2, 1fr)" },
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton height={132} key={index} variant="rounded" />
        ))}
      </Box>
      <Skeleton height={280} sx={{ mt: 2 }} variant="rounded" />
    </Box>
  );
}

function MetricCard({ icon, label, value }: Readonly<{ icon: ReactNode; label: string; value: number }>) {
  return (
    <Paper aria-label={label} role="group" sx={{ border: 1, borderColor: "divider", p: 2.5 }} variant="outlined">
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
        <Stack spacing={0.5}>
          <Typography sx={{ color: "text.secondary" }} variant="body2">
            {label}
          </Typography>
          <Typography component="p" sx={{ fontWeight: 700 }} variant="h4">
            {value}
          </Typography>
        </Stack>
        <Box
          sx={theme => ({
            alignItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            borderRadius: 2,
            color: "primary.main",
            display: "flex",
            height: 44,
            justifyContent: "center",
            width: 44,
          })}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

function StatusDistribution({ summary }: Readonly<{ summary: DashboardSummary }>) {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Paper sx={{ border: 1, borderColor: "divider", p: 3 }} variant="outlined">
      <Stack spacing={2.5}>
        <Box>
          <Typography component="h3" variant="h6">
            {t("contacts.dashboard.status.title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }} variant="body2">
            {t("contacts.dashboard.status.description")}
          </Typography>
        </Box>
        <Stack spacing={2}>
          {contactStatusSchema.options.map(status => {
            const count = summary.statusCounts[status];
            const label = t(`contacts.status.${status}`);
            const percentage = Math.round((count / summary.total) * 100);
            return (
              <Stack key={status} spacing={0.75}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {label}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }} variant="body2">
                    {t("contacts.dashboard.status.value", { count, percentage })}
                  </Typography>
                </Stack>
                <LinearProgress
                  aria-label={label}
                  color={status === "ACTIVE" ? "success" : "inherit"}
                  value={percentage}
                  variant="determinate"
                />
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

function OrganizationBreakdown({ organizations }: Readonly<{ organizations: DashboardSummary["organizations"] }>) {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Paper sx={{ border: 1, borderColor: "divider", p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Box>
          <Typography component="h3" variant="h6">
            {t("contacts.dashboard.organizations.title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }} variant="body2">
            {t("contacts.dashboard.organizations.description")}
          </Typography>
        </Box>
        <Stack divider={<Divider flexItem />} spacing={1.5}>
          {organizations.slice(0, 5).map(({ count, name }) => (
            <Stack
              direction="row"
              key={name}
              spacing={2}
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography noWrap>{name}</Typography>
              <Chip label={t("contacts.dashboard.organizations.count", { count })} size="small" variant="outlined" />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function DirectorySnapshot({ contacts }: Readonly<{ contacts: readonly Contact[] }>) {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Paper sx={{ border: 1, borderColor: "divider", p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Box>
          <Typography component="h3" variant="h6">
            {t("contacts.dashboard.directory.title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }} variant="body2">
            {t("contacts.dashboard.directory.description")}
          </Typography>
        </Box>
        <Stack divider={<Divider flexItem />}>
          {contacts.slice(0, 5).map(contact => (
            <Stack
              direction={{ sm: "row", xs: "column" }}
              key={contact.id}
              sx={{
                alignItems: { sm: "center", xs: "flex-start" },
                gap: 1,
                justifyContent: "space-between",
                py: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 600 }}>
                  {contact.name}
                </Typography>
                <Typography noWrap sx={{ color: "text.secondary" }} variant="body2">
                  {contact.organization} · {contact.role}
                </Typography>
              </Box>
              <Chip
                color={contact.status === "ACTIVE" ? "success" : "default"}
                label={t(`contacts.status.${contact.status}`)}
                size="small"
                variant="outlined"
              />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

/** Summarizes the browser-backed contact directory on the Home route. */
export function ContactsDashboard() {
  const { t } = useDevelopmentGuideTranslation();
  const { ContactQuery } = useContactsFeature();
  const contacts = useQuery(ContactQuery.findAll());
  const summary = contacts.data?.length ? summarizeContacts(contacts.data) : undefined;

  return (
    <Stack spacing={3}>
      <DashboardHero />

      {contacts.isPending ? <DashboardLoading /> : null}

      {contacts.isError ? (
        <Alert
          action={
            <Button color="inherit" onClick={() => void contacts.refetch()}>
              {t("contacts.dashboard.retry")}
            </Button>
          }
          severity="error"
        >
          {t("contacts.dashboard.loadFailed")}
        </Alert>
      ) : null}

      {contacts.data?.length === 0 ? (
        <Paper
          sx={{
            border: 1,
            borderColor: "divider",
            p: { sm: 5, xs: 3 },
            textAlign: "center",
          }}
          variant="outlined"
        >
          <Stack spacing={1.5} sx={{ alignItems: "center" }}>
            <GroupOutlinedIcon color="primary" fontSize="large" />
            <Typography component="h3" variant="h5">
              {t("contacts.dashboard.empty.title")}
            </Typography>
            <Typography color="text.secondary">{t("contacts.dashboard.empty.description")}</Typography>
            <Button component={RouterLink} to="/dev-guide/frontend/example-pages/contacts-crud" variant="contained">
              {t("contacts.dashboard.empty.action")}
            </Button>
          </Stack>
        </Paper>
      ) : null}

      {summary && contacts.data ? (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                lg: "repeat(4, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            <MetricCard
              icon={<GroupOutlinedIcon />}
              label={t("contacts.dashboard.metrics.total")}
              value={summary.total}
            />
            <MetricCard
              icon={<CheckCircleOutlineOutlinedIcon />}
              label={t("contacts.dashboard.metrics.active")}
              value={summary.statusCounts.ACTIVE}
            />
            <MetricCard
              icon={<PauseCircleOutlineOutlinedIcon />}
              label={t("contacts.dashboard.metrics.inactive")}
              value={summary.statusCounts.INACTIVE}
            />
            <MetricCard
              icon={<BusinessOutlinedIcon />}
              label={t("contacts.dashboard.metrics.organizations")}
              value={summary.organizations.length}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                lg: "1fr 1fr",
                xs: "minmax(0, 1fr)",
              },
            }}
          >
            <StatusDistribution summary={summary} />
            <OrganizationBreakdown organizations={summary.organizations} />
          </Box>

          <DirectorySnapshot contacts={contacts.data} />
        </>
      ) : null}
    </Stack>
  );
}
