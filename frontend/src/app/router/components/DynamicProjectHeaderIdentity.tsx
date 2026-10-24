import ArrowDropDownOutlinedIcon from "@mui/icons-material/ArrowDropDownOutlined";
import { Button, Menu, MenuItem } from "@mui/material";
import { useState, type MouseEvent } from "react";
import { Link, type Params } from "react-router";

const exampleProjects = ["atlas", "orion"] as const;
const projectRoute = (projectId: string) =>
  `/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/${encodeURIComponent(projectId)}`;

/** Route-owned example of dynamic context beside the stable guide identity. */
export function DynamicProjectHeaderIdentity({ params }: Readonly<{ params: Readonly<Params<string>> }>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const projectId = params.projectId ?? exampleProjects[0];

  return (
    <>
      <Button
        aria-expanded={anchor !== null}
        aria-haspopup="menu"
        endIcon={<ArrowDropDownOutlinedIcon />}
        onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget)}
        size="small"
        sx={{ color: "text.primary", flexShrink: 0, fontWeight: 600, minWidth: 0, textTransform: "none" }}
        variant="text"
      >
        {projectId}
      </Button>
      <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={anchor !== null}>
        {exampleProjects.map(project => (
          <MenuItem
            component={Link}
            key={project}
            onClick={() => setAnchor(null)}
            selected={project === projectId}
            to={projectRoute(project)}
          >
            {project}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
