import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Phone, User, ArrowUp, ArrowDown, Pencil, X, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { shareEmergency } from "@/lib/share";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — Abhaya" }] }),
  component: ContactsPage,
});

type Contact = {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  priority: number;
};

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("id, name, phone, relationship, priority")
      .order("priority", { ascending: true });
    if (error) toast.error(error.message);
    setContacts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Contact removed");
    load();
  };

  const move = async (contact: Contact, dir: -1 | 1) => {
    const idx = contacts.findIndex((c) => c.id === contact.id);
    const swap = contacts[idx + dir];
    if (!swap) return;
    await supabase.from("emergency_contacts").update({ priority: swap.priority }).eq("id", contact.id);
    await supabase.from("emergency_contacts").update({ priority: contact.priority }).eq("id", swap.id);
    load();
  };

  return (
    <div className="pb-24">
      <AppHeader title="Emergency Contacts" back="/profile" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <div className="rounded-2xl bg-brand-soft p-4 text-sm text-foreground/80">
          These contacts are called in order during an SOS. Keep your top priority contact reachable.
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center">
            <User className="mx-auto h-10 w-10 text-muted-foreground" />
            <div className="mt-3 font-semibold">No emergency contacts yet</div>
            <div className="mt-1 text-sm text-muted-foreground">Add at least one contact so SOS can reach them.</div>
          </div>
        ) : (
          <ul className="space-y-3">
            {contacts.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-border/60">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-semibold">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.phone}{c.relationship ? ` · ${c.relationship}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(c, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => move(c, 1)} disabled={i === contacts.length - 1} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => { setEditing(c); setShowForm(true); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-emergency hover:bg-emergency/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button variant="brand" size="lg" className="w-full" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-5 w-5" /> Add contact
        </Button>

        {contacts.length > 0 && (
          <Button
            variant="emergency"
            size="lg"
            className="w-full"
            onClick={async () => {
              const pos = await new Promise<{ lat: number; lng: number; accuracy: number } | null>((res) => {
                if (!navigator.geolocation) return res(null);
                navigator.geolocation.getCurrentPosition(
                  (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
                  () => res(null),
                  { enableHighAccuracy: true, timeout: 8000 },
                );
              });
              const r = await shareEmergency(pos, contacts.map((c) => c.phone));
              if (r === "shared" || r === "sms") toast.success("Emergency message ready to send");
              else if (r === "copied") toast.success("Location copied — paste in your messages");
              else toast.error("Could not share");
            }}
          >
            <Send className="h-5 w-5" /> Send emergency message to all
          </Button>
        )}
      </main>

      {showForm && (
        <ContactFormSheet
          contact={editing}
          nextPriority={(contacts.at(-1)?.priority ?? 0) + 1}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function ContactFormSheet({
  contact,
  nextPriority,
  onClose,
  onSaved,
}: {
  contact: Contact | null;
  nextPriority: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [relationship, setRelationship] = useState(contact?.relationship ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return toast.error("Name and phone required");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setSaving(false); return toast.error("Not signed in"); }

    const payload = { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() || null };
    const { error } = contact
      ? await supabase.from("emergency_contacts").update(payload).eq("id", contact.id)
      : await supabase.from("emergency_contacts").insert({ ...payload, user_id: uid, priority: nextPriority });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(contact ? "Contact updated" : "Contact added");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg animate-float-up space-y-4 rounded-t-3xl bg-surface p-5 pb-8 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{contact ? "Edit contact" : "New emergency contact"}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-soft" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Phone number</span>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background pl-3 focus-within:border-brand">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98…" type="tel" className="flex-1 bg-transparent py-3 pr-4 text-sm outline-none" />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Relationship (optional)</span>
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Mother, friend…" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand" />
        </label>
        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={saving}>
          <Check className="h-5 w-5" /> {saving ? "Saving…" : "Save contact"}
        </Button>
      </form>
    </div>
  );
}
