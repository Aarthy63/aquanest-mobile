import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { Screen, EmptyState } from "@/components/app/Screen";
import { Field } from "@/components/app/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — AquaNest" },
      { name: "description", content: "Get a link to reset your AquaNest account password." },
      { property: "og:title", content: "Reset password — AquaNest" },
      { property: "og:description", content: "Get a link to reset your AquaNest account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email") });

function Forgot() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <Screen title="Reset password" back hideNav>
      {sentTo ? (
        <EmptyState
          icon={<MailCheck className="size-8" />}
          title="Check your email"
          body={`If an account exists for ${sentTo}, you'll get a link to reset your password.`}
          action={<Button asChild variant="hero" size="lg"><Link to="/login">Back to sign in</Link></Button>}
        />
      ) : (
        <form
          onSubmit={handleSubmit(async (v) => {
            await new Promise((r) => setTimeout(r, 700));
            setSentTo(v.email);
          })}
          className="space-y-4 p-6"
        >
          <p className="text-sm text-muted-foreground">Enter the email you used to sign up and we'll send you a reset link.</p>
          <Field label="Email" error={formState.errors.email?.message}>
            <Input type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="animate-spin" />} Send reset link
          </Button>
        </form>
      )}
    </Screen>
  );
}
