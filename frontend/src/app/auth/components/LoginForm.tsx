import { Alert, Paper, Typography } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { useState } from "react";
import { useNavigate } from "react-router";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";

import { appHttpErrorMessageKey, decodeAppHttpError, type AppHttpError } from "@/app/data/http/appHttpError";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppAuth } from "../hooks/useAppAuth";
import { appLoginCredentialsSchema } from "../models/AppLoginCredentials";
import { AppInvalidCredentialsError } from "../api/appAuth.api";

export function LoginForm({ returnTo = "/" }: Readonly<{ returnTo?: string }>) {
  const auth = useAppAuth();
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<"invalid" | AppHttpError | null>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  const errorMessageKey =
    loginError === "invalid"
      ? "authentication.invalidCredentials"
      : (appHttpErrorMessageKey(loginError) ?? "authentication.signInFailed");
  const fieldError = (name: string) =>
    loginError && loginError !== "invalid"
      ? loginError.fieldErrors.find(detail => detail.field === name)?.code
      : undefined;
  function fieldHelper(name: string) {
    const code = fieldError(name);
    return code ? t(`httpErrors.fields.${code}`) : undefined;
  }
  function clearServerErrors() {
    setLoginError(null);
    setLoginFailed(false);
  }
  const form = useRgoForm({
    defaultValues: { password: "", username: "" },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: appLoginCredentialsSchema },
    onSubmit: async ({ value }) => {
      try {
        clearServerErrors();
        await auth.login(appLoginCredentialsSchema.parse(value));
        navigate(returnTo, { replace: true });
      } catch (error) {
        setLoginFailed(true);
        setLoginError(
          error instanceof AppInvalidCredentialsError ? "invalid" : decodeAppHttpError(error, ["username", "password"]),
        );
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
            {loginFailed ? <Alert severity="error">{t(errorMessageKey)}</Alert> : null}
            <form.AppField listeners={{ onChange: clearServerErrors }} name="username">
              {field => (
                <field.TextField
                  autoComplete="username"
                  autoFocus
                  helperText={fieldHelper("username")}
                  label={t("authentication.username")}
                  required
                />
              )}
            </form.AppField>
            <form.AppField listeners={{ onChange: clearServerErrors }} name="password">
              {field => (
                <field.TextField
                  autoComplete="current-password"
                  helperText={fieldHelper("password")}
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
