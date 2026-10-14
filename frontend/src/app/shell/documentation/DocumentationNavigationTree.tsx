import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import { Box, Collapse, List, ListItem, ListItemButton, ListSubheader, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import type { DocumentationNavigationGroup } from "./DocumentationNavigation";

import { documentationNavigationItemMatchesPath } from "./documentationPathMatching";

type DocumentationNavigationTreeProps = Readonly<{
  groups: readonly DocumentationNavigationGroup[];
  navigationLabel: string;
}>;

type LabelRevealPosition = Readonly<{
  color: string;
  fontWeight: number;
  height: number;
  left: number;
  top: number;
}>;

type UseNavigationLabelRevealOptions = Readonly<{
  label: string;
}>;

const revealCloseDelayMs = 80;

function useNavigationLabelReveal({ label }: UseNavigationLabelRevealOptions) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const focusedRef = useRef(false);
  const overlayHoveredRef = useRef(false);
  const revealSuppressedRef = useRef(false);
  const sourceHoveredRef = useRef(false);
  const [position, setPosition] = useState<LabelRevealPosition | null>(null);

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = undefined;
  }, []);

  const closeRevealAfterActivation = useCallback(() => {
    cancelClose();
    revealSuppressedRef.current = true;
    setPosition(null);
  }, [cancelClose]);

  const revealIfTruncated = useCallback(() => {
    if (revealSuppressedRef.current) return;

    const element = labelRef.current;
    if (!element || element.scrollWidth <= element.clientWidth + 1) {
      setPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const fontWeight = Number.parseInt(computedStyle.fontWeight, 10);
    setPosition({
      color: computedStyle.color,
      fontWeight: Number.isNaN(fontWeight) ? 400 : fontWeight,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    });
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      if (!focusedRef.current && !overlayHoveredRef.current && !sourceHoveredRef.current) {
        setPosition(null);
      }
    }, revealCloseDelayMs);
  }, [cancelClose]);

  useEffect(() => {
    if (!position) return;

    const close = () => setPosition(null);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  const interactionProps = {
    onBlur: () => {
      focusedRef.current = false;
      revealSuppressedRef.current = false;
      scheduleClose();
    },
    onFocus: () => {
      focusedRef.current = true;
      cancelClose();
      revealIfTruncated();
    },
    onPointerEnter: () => {
      sourceHoveredRef.current = true;
      cancelClose();
      revealIfTruncated();
    },
    onPointerLeave: () => {
      revealSuppressedRef.current = false;
      sourceHoveredRef.current = false;
      scheduleClose();
    },
  };

  const reveal =
    position && typeof document !== "undefined"
      ? createPortal(
          <Box
            aria-hidden
            component="span"
            data-examples-navigation-label-reveal
            onPointerDown={cancelClose}
            onPointerEnter={() => {
              overlayHoveredRef.current = true;
              cancelClose();
            }}
            onPointerLeave={() => {
              overlayHoveredRef.current = false;
              scheduleClose();
            }}
            style={{
              color: position.color,
              fontWeight: position.fontWeight,
            }}
            sx={theme => ({
              bgcolor: "background.default",
              boxShadow: theme.shadows[2],
              cursor: "pointer",
              display: "block",
              fontSize: "0.875rem",
              height: `${position.height}px`,
              left: `${position.left}px`,
              lineHeight: "20px",
              maxWidth: `calc(100vw - ${position.left + 8}px)`,
              overflow: "hidden",
              position: "fixed",
              pr: "6px",
              textDecoration: "underline",
              textOverflow: "ellipsis",
              textUnderlineOffset: "3px",
              top: `${position.top}px`,
              whiteSpace: "nowrap",
              width: "max-content",
              zIndex: theme.zIndex.tooltip,
            })}
          >
            {label}
          </Box>,
          document.body,
        )
      : null;

  return { closeRevealAfterActivation, interactionProps, labelRef, reveal };
}

type DocumentationNavigationItemProps = Readonly<{
  item: DocumentationNavigationGroup["items"][number];
  label: string;
  selected: boolean;
}>;

function DocumentationNavigationItem({ item, label, selected }: DocumentationNavigationItemProps) {
  const { closeRevealAfterActivation, interactionProps, labelRef, reveal } = useNavigationLabelReveal({ label });

  return (
    <ListItem disablePadding>
      <ListItemButton
        {...interactionProps}
        component={NavLink}
        onClick={closeRevealAfterActivation}
        selected={selected}
        sx={{
          alignItems: "center",
          borderRadius: 0,
          color: "text.secondary",
          minWidth: 0,
          position: "relative",
          px: "6px",
          py: 0,
          "&:hover": {
            bgcolor: "transparent",
            "& [data-examples-navigation-label]": {
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            },
          },
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: "rgo.focus",
            outlineOffset: "-2px",
          },
          "&.Mui-selected": {
            bgcolor: "transparent",
            color: "text.primary",
            "&::before": {
              bgcolor: "primary.main",
              borderRadius: "1px",
              content: '""',
              height: "16px",
              left: 0,
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              width: "2px",
            },
            "& [data-examples-navigation-label]": { fontWeight: 700 },
            "&:hover": { bgcolor: "transparent" },
          },
        }}
        to={item.to}
      >
        <Box
          component="span"
          data-examples-navigation-label
          ref={labelRef}
          sx={{
            display: "block",
            flex: "1 1 auto",
            fontSize: "0.875rem",
            lineHeight: "20px",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Box>
        {reveal}
      </ListItemButton>
    </ListItem>
  );
}

type DocumentationNavigationGroupProps = Readonly<{
  expanded: boolean;
  group: DocumentationNavigationGroup;
  onToggle: () => void;
  pathname: string;
}>;

function DocumentationNavigationGroupView({ expanded, group, onToggle, pathname }: DocumentationNavigationGroupProps) {
  const { t } = useDevelopmentGuideTranslation();
  const categoryLabel = t(group.labelKey);
  const { closeRevealAfterActivation, interactionProps, labelRef, reveal } = useNavigationLabelReveal({
    label: categoryLabel,
  });

  return (
    <Box component="li" sx={{ listStyle: "none", minWidth: 0 }}>
      <ListSubheader
        component="div"
        disableSticky
        sx={{
          bgcolor: "transparent",
          color: "text.primary",
          fontSize: "0.875rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
          lineHeight: "20px",
          p: 0,
        }}
      >
        <Box
          {...interactionProps}
          aria-expanded={expanded}
          aria-label={t(expanded ? "navigation.collapseCategory" : "navigation.expandCategory", {
            category: categoryLabel,
          })}
          color="inherit"
          component="button"
          onClick={() => {
            closeRevealAfterActivation();
            onToggle();
          }}
          sx={{
            alignItems: "center",
            background: "none",
            border: 0,
            borderRadius: 0,
            color: "inherit",
            cursor: "pointer",
            display: "flex",
            font: "inherit",
            gap: "4px",
            justifyContent: "flex-start",
            letterSpacing: "inherit",
            lineHeight: "inherit",
            ml: "-20px",
            minWidth: 0,
            pl: 0,
            pr: "6px",
            py: "2px",
            width: "calc(100% + 20px)",
            "&:hover": { bgcolor: "transparent" },
            "&:hover [data-examples-navigation-label]": {
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "rgo.focus",
              outlineOffset: "-2px",
            },
          }}
          type="button"
        >
          <ChevronRightOutlinedIcon
            sx={{
              color: "text.secondary",
              flex: "0 0 auto",
              fontSize: "1rem",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: theme =>
                theme.transitions.create("transform", {
                  duration: theme.transitions.duration.shortest,
                }),
            }}
          />
          <Box
            component="span"
            data-examples-navigation-label
            ref={labelRef}
            sx={{
              display: "block",
              flex: "1 1 auto",
              minWidth: 0,
              overflow: "hidden",
              textAlign: "left",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {categoryLabel}
          </Box>
          {reveal}
        </Box>
      </ListSubheader>
      <Collapse in={expanded} sx={{ maxWidth: "100%", overflowX: "hidden" }} timeout="auto" unmountOnExit>
        <List
          disablePadding
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            minWidth: 0,
            pl: "10px",
          }}
        >
          {group.items.map(item => (
            <DocumentationNavigationItem
              item={item}
              key={item.to}
              label={t(item.labelKey)}
              selected={documentationNavigationItemMatchesPath(item, pathname)}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
}

/** Renders a categorized secondary navigation tree supplied by route composition. */
export function DocumentationNavigationTree({ groups, navigationLabel }: DocumentationNavigationTreeProps) {
  const { t } = useDevelopmentGuideTranslation();
  const { pathname } = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Partial<Record<string, boolean>>>(() =>
    groups.reduce<Partial<Record<string, boolean>>>(
      (expanded, group) => ({
        ...expanded,
        [group.id]:
          group.defaultExpanded || group.items.some(item => documentationNavigationItemMatchesPath(item, pathname)),
      }),
      {},
    ),
  );

  const sections: DocumentationNavigationGroup[][] = [];
  for (const group of groups) {
    if (group.items.length === 0) continue;
    const previous = sections.at(-1);
    if (group.section && previous?.[0]?.section === group.section) {
      previous.push(group);
    } else {
      sections.push([group]);
    }
  }

  const renderGroup = (group: DocumentationNavigationGroup) => {
    const expanded = expandedGroups[group.id] ?? group.defaultExpanded;
    return (
      <DocumentationNavigationGroupView
        expanded={expanded}
        group={group}
        key={group.id}
        onToggle={() =>
          setExpandedGroups(current => ({
            ...current,
            [group.id]: !expanded,
          }))
        }
        pathname={pathname}
      />
    );
  };

  return (
    <Box
      aria-label={navigationLabel}
      component="nav"
      sx={{
        boxSizing: "border-box",
        minWidth: 0,
        overflowX: "hidden",
        pl: "20px",
      }}
    >
      <List
        disablePadding
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: 0,
        }}
      >
        {sections.map(members => {
          const first = members[0]!;
          if (!first.section) return renderGroup(first);

          return (
            <Box component="li" key={first.id} sx={{ listStyle: "none", minWidth: 0 }}>
              <Box aria-label={t(first.sectionLabelKey ?? "navigation.stateCategory")} role="group">
                <Typography
                  component="div"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    lineHeight: "18px",
                    mb: "4px",
                    ml: "-20px",
                  }}
                >
                  {t(first.sectionLabelKey ?? "navigation.stateCategory")}
                </Typography>
                <List
                  disablePadding
                  sx={{
                    borderLeft: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    minWidth: 0,
                    ml: "-16px",
                    pl: "24px",
                  }}
                >
                  {members.map(renderGroup)}
                </List>
              </Box>
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
