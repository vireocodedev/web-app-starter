import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import { Fab, Zoom } from "@mui/material";
import { useEffect, useState } from "react";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

const visibilityThreshold = 240;

/** Provides an opt-in route action after the document has been scrolled. */
export function RouteScrollToTop() {
  const { t } = useAppTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > visibilityThreshold);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <Zoom in={visible} mountOnEnter unmountOnExit>
      <Fab
        aria-label={t("navigation.scrollToTop")}
        color="primary"
        onClick={() => window.scrollTo({ behavior: "auto", left: 0, top: 0 })}
        size="small"
        sx={{
          bottom: { sm: 24, xs: 16 },
          position: "fixed",
          right: { sm: 24, xs: 16 },
          zIndex: theme => theme.zIndex.speedDial,
        }}
      >
        <KeyboardArrowUpOutlinedIcon />
      </Fab>
    </Zoom>
  );
}
