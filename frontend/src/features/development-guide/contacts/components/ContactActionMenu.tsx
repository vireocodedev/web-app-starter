import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useState } from "react";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import type { Contact } from "../models/Contact";

type ContactActionMenuProps = Readonly<{
  contact: Contact;
  onOpenDetails: (contact: Contact) => void;
  onOpenEditor: (contact: Contact) => void;
  onRemove: (contact: Contact) => Promise<void>;
  pendingRemoval: boolean;
}>;

export function ContactActionMenu({
  contact,
  onOpenDetails,
  onOpenEditor,
  onRemove,
  pendingRemoval,
}: ContactActionMenuProps) {
  const { t } = useDevelopmentGuideTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        aria-label={t("contacts.actions.more", { name: contact.name })}
        aria-expanded={Boolean(anchorEl)}
        aria-haspopup="menu"
        onClick={event => setAnchorEl(event.currentTarget)}
        size="small"
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} onClose={closeMenu} open={Boolean(anchorEl)}>
        <MenuItem
          onClick={() => {
            closeMenu();
            onOpenDetails(contact);
          }}
        >
          {t("contacts.details.open", { name: contact.name })}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            onOpenEditor(contact);
          }}
        >
          {t("contacts.actions.edit", { name: contact.name })}
        </MenuItem>
        <MenuItem
          disabled={pendingRemoval}
          onClick={() => {
            closeMenu();
            void onRemove(contact);
          }}
        >
          {t("contacts.actions.delete", { name: contact.name })}
        </MenuItem>
      </Menu>
    </>
  );
}
