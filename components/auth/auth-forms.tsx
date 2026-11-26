"use client";

import { useActionState, useState } from "react";
import { Check, ClipboardList } from "lucide-react";

import { signIn, signUp } from "@/lib/auth-actions";
import { initialAuthFormState, type AuthFormState } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthMode = "login" | "signup";

type CredentialsFormProps = {
  mode: AuthMode;
  state: AuthFormState;
  pending: boolean;
  action: (formData: FormData) => void;
};

export function CredentialsForm({ mode, state, pending, action }: CredentialsFormProps) {
  const emailErrors = state.errors?.email ?? [];
  const passwordErrors = state.errors?.password ?? [];
  const emailErrorId = emailErrors.length > 0 ? "email-error" : undefined;
  const passwordHintId = mode === "signup" ? "password-hint" : undefined;
  const passwordErrorId = passwordErrors.length > 0 ? "password-error" : undefined;
  const passwordDescribedBy = [passwordHintId, passwordErrorId].filter(Boolean).join(" ") || undefined;
  const hasFieldErrors = emailErrors.length > 0 || passwordErrors.length > 0;
  const isSuccess = state.ok === true && !hasFieldErrors;
  const hasAlert = Boolean(state.message) || hasFieldErrors;
  const submitLabel = pending
    ? mode === "login"
      ? "Entrando…"
      : "Creando cuenta…"
    : mode === "login"
      ? "Iniciar sesión"
      : "Crear cuenta";

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {hasAlert ? (
        <div
          role={isSuccess ? "status" : "alert"}
          className={
            isSuccess
              ? "flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {isSuccess ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
          {state.message ? <p>{state.message}</p> : null}
          {emailErrors.map((error) => (
            <p key={error} id="email-error">
              {error}
            </p>
          ))}
          {passwordErrors.map((error) => (
            <p key={error} id="password-error">
              {error}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={emailErrors.length > 0}
          aria-describedby={emailErrorId}
          placeholder="tu@negocio.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          aria-invalid={passwordErrors.length > 0}
          aria-describedby={passwordDescribedBy}
        />
        {mode === "signup" ? (
          <p id="password-hint" className="text-sm text-muted-foreground">
            Mínimo 6 caracteres.
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} aria-busy={pending} className="h-9 w-full cursor-pointer">
        {submitLabel}
      </Button>
    </form>
  );
}

export function AuthForms() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initialAuthFormState);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initialAuthFormState);
  const isLogin = mode === "login";

  return (
    <Card className="w-full max-w-md bg-card shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <p className="font-heading text-lg font-semibold">Gestor de pedidos</p>
        </div>
        <CardTitle>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {isLogin ? "Inicia sesión" : "Crea tu cuenta"}
          </h1>
        </CardTitle>
        <CardDescription className="text-sm text-foreground/80">
          {isLogin
            ? "Usa el correo y la contraseña del negocio."
            : "Registra el correo con el que vas a gestionar los pedidos."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CredentialsForm
          key={mode}
          mode={mode}
          state={isLogin ? loginState : signupState}
          pending={isLogin ? loginPending : signupPending}
          action={isLogin ? loginAction : signupAction}
        />
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full cursor-pointer"
          onClick={() => setMode(isLogin ? "signup" : "login")}
        >
          {isLogin ? "Crear una cuenta" : "Ya tengo cuenta"}
        </Button>
      </CardContent>
    </Card>
  );
}
