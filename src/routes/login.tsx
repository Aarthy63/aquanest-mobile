import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Droplets, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/app/Screen";
import { Field } from "@/components/app/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — AquaNest" },
      { name: "description", content: "Sign in to your AquaNest customer or dealer account." },
      { property: "og:title", content: "Sign in — AquaNest" },
      { property: "og:description", content: "Sign in to your AquaNest customer or dealer account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function Login() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const login = useApp((s) => s.login);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    await new Promise((r) => setTimeout(r, 600));
    login(v.email);
    toast.success("Welcome back!");
    const safe = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    navigate({ to: safe, replace: true });
  };

  return (
    <Screen hideNav header={null}>
      <div className="bg-ocean px-6 pb-14 pt-12 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold"><Droplets className="size-6" /> AquaNest</Link>
        <h1 className="mt-8 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm opacity-85">Sign in to track orders and book service.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="-mt-8 space-y-4 rounded-t-3xl bg-background px-6 pt-8">
        <Field label="Email" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <div className="relative">
            <Input type={show ? "text" : "password"} autoComplete="current-password" {...register("password")} />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-semibold text-primary">Forgot password?</Link>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="animate-spin" />} Sign in
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here? <Link to="/register" className="font-semibold text-primary">Create account</Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Business owner? <Link to="/register" search={{ type: "dealer" }} className="font-semibold text-primary">Register as dealer</Link>
        </p>
      </form>
    </Screen>
  );
}
