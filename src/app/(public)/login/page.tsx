"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // TODO: Implement actual Google OAuth via @energismart/shared
    // For now, redirect to dashboard (development mode allows access)
    setTimeout(() => {
      router.push(callbackUrl);
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary">
            <Sun className="size-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Suncare</CardTitle>
            <CardDescription>Service Management System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Logg inn med din EnergiSmart-konto for å fortsette
          </p>

          <Button
            onClick={handleGoogleLogin}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logger inn...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Logg inn med Google
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Ved å logge inn godtar du våre{" "}
            <a href="#" className="underline hover:text-foreground">
              vilkår
            </a>{" "}
            og{" "}
            <a href="#" className="underline hover:text-foreground">
              personvernregler
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
