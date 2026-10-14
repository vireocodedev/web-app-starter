import { Alert, Paper, Typography } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { useState } from "react";
import { useNavigate } from "react-router";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppAuth } from "../hooks/useAppAuth";
import { appLoginCredentialsSchema } from "../models/AppLoginCredentials";
import { AppInvalidCredentialsError } from "../api/appAuth.api";

export function LoginForm({ returnTo = "/" }: Readonly<{ returnTo?: string }>) {
  const auth = useAppAuth();
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<"invalid" | "unavailable" | null>(null);
  const form = useRgoForm({
    defaultValues: { password: "", username: "" },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: appLoginCredentialsSchema },
    onSubmit: async ({ value }) => {
      try {
        setLoginError(null);
        await auth.login(appLoginCredentialsSchema.parse(value));
        navigate(returnTo, { replace: true });
      } catch (error) {
        setLoginError(error instanceof AppInvalidCredentialsError ? "invalid" : "unavailable");
      }
    },
  });
  return (
    <Paper sx={{ maxWidth: 420, mx: "auto", mt: 8, p: 3 }}>
      <form.AppForm>
        <form.Form>
          <RgoContainerGrid columns={1} container spacing={2}>
            <Typography component="h1" variant="h4">
              {t("authentication.title")}
            </Typography>
            {auth.loginAssistance ? (
              <Alert severity="info">{t("authentication.demoCredentials", auth.loginAssistance)}</Alert>
            ) : null}
            {loginError ? (
              <Alert severity="error">
                {t(loginError === "invalid" ? "authentication.invalidCredentials" : "authentication.signInFailed")}
              </Alert>
            ) : null}
            <form.AppField name="username">
              {field => (
                <field.TextField autoComplete="username" autoFocus label={t("authentication.username")} required />
              )}
            </form.AppField>
            <form.AppField name="password">
              {field => (
                <field.TextField
                  autoComplete="current-password"
                  label={t("authentication.password")}
                  required
                  type="password"
                />
              )}
            </form.AppField>
            <form.SubmitButton variant="contained">{t("authentication.signIn")}</form.SubmitButton>
          </RgoContainerGrid>
        </form.Form>
      </form.AppForm>
    </Paper>
  );
}
