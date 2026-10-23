import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Screen, EmptyState } from "@/components/app/Screen";
import { RequireLogin } from "@/components/app/RequireLogin";
import { BottomSheet } from "@/components/app/BottomSheet";
import { AddressForm } from "@/components/app/AddressForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApp, type Address } from "@/store/app-store";

export const Route = createFileRoute("/addresses")({
  head: () => ({
    meta: [
      { title: "Saved Addresses — AquaNest" },
      { name: "description", content: "Manage delivery and service visit addresses." },
      { property: "og:title", content: "Saved Addresses — AquaNest" },
      { property: "og:description", content: "Manage delivery and service visit addresses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Screen title="Saved addresses" back>
      <RequireLogin>
        <Addresses />
      </RequireLogin>
    </Screen>
  ),
});

function Addresses() {
  const addresses = useApp((s) => s.addresses);
  const save = useApp((s) => s.saveAddress);
  const del = useApp((s) => s.deleteAddress);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);

  return (
    <div className="space-y-3 p-4">
      {addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="size-8" />} title="No saved addresses" body="Add an address for faster checkout and service booking." />
      ) : (
        addresses.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{a.name} <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-secondary-foreground">{a.label}</span></p>
                <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} – {a.pincode}</p>
                <p className="text-muted-foreground">{a.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(a)}><Pencil /> Edit</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive"><Trash2 /> Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[340px] rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete address?</AlertDialogTitle>
                    <AlertDialogDescription>This address will be removed from your account.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { del(a.id); toast("Address deleted"); }}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))
      )}
      <Button variant="outline" size="lg" className="w-full border-dashed" onClick={() => setEditing({})}>
        <Plus /> Add new address
      </Button>

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit address" : "New address"}>
        {editing && (
          <AddressForm
            key={editing.id ?? "new"}
            initial={editing}
            onSubmit={(v) => {
              save({ ...v, id: editing.id });
              setEditing(null);
              toast.success("Address saved");
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}
