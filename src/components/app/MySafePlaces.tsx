import { useEffect, useState, useCallback } from "react";
import { MapPin, Plus, Trash2, Navigation, Phone, Loader2, Search, LocateFixed, Map as MapIcon, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export type MyPlace = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  address: string | null;
  phone: string | null;
  notes: string | null;
};

const KINDS: { value: string; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "family", label: "Family / Relative" },
  { value: "friend", label: "Friend's place" },
  { value: "work", label: "Work / College" },
  { value: "shop", label: "Trusted shop" },
  { value: "police", label: "Police / Help point" },
  { value: "hospital", label: "Hospital / Clinic" },
  { value: "other", label: "Other" },
];
const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? "Other";

const CACHE_KEY = "abhaya:mySafePlaces";

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

type SearchHit = { display_name: string; lat: string; lon: string };

export function MySafePlaces({
  pos,
  onShowOnMap,
}: {
  pos: { lat: number; lng: number };
  onShowOnMap: (p: { name: string; lat: number; lng: number }) => void;
}) {
  const [places, setPlaces] = useState<MyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setPlaces(JSON.parse(cached));
    } catch { /* ignore */ }
    const { data, error } = await supabase
      .from("custom_safe_places")
      .select("id,name,kind,lat,lng,address,phone,notes")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPlaces(data as MyPlace[]);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Remove this place from your safe places?")) return;
    const prev = places;
    setPlaces((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from("custom_safe_places").delete().eq("id", id);
    if (error) {
      setPlaces(prev);
      toast.error("Couldn't remove the place. Please try again.");
    } else {
      toast.success("Place removed");
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(prev.filter((x) => x.id !== id))); } catch { /* ignore */ }
    }
  };

  const sorted = places
    .map((p) => ({ ...p, km: distKm(pos, p) }))
    .sort((a, b) => a.km - b.km);

  return (
    <section className="my-safe-places space-y-3 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/60">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Star className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">My Safe Places</div>
            <div className="text-xs text-muted-foreground">Places you trust — only you can see them</div>
          </div>
        </div>
        <Button size="sm" variant="brand" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {loading && places.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading your places…
        </div>
      ) : sorted.length === 0 ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:bg-brand-soft"
        >
          Add your home, a friend's house, workplace or any spot where you feel safe.
        </button>
      ) : (
        <ul className="space-y-2">
          {sorted.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border/60 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{kindLabel(p.kind)}</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-brand">{fmtKm(p.km)}</div>
                  </div>
                  {(p.address || p.notes) && (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.address ?? p.notes}</div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="brand">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">
                        <Navigation className="h-4 w-4" /> Directions
                      </a>
                    </Button>
                    {p.phone && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`tel:${p.phone.replace(/\s+/g, "")}`}><Phone className="h-4 w-4" /> Call</a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onShowOnMap(p)}>
                      <MapIcon className="h-4 w-4" /> Map
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddPlaceDialog
        open={open}
        onOpenChange={setOpen}
        pos={pos}
        onSaved={(p) => {
          setPlaces((prev) => {
            const next = [p, ...prev];
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
          });
        }}
      />
    </section>
  );
}

function AddPlaceDialog({
  open, onOpenChange, pos, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pos: { lat: number; lng: number };
  onSaved: (p: MyPlace) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("friend");
  const [mode, setMode] = useState<"current" | "search">("current");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lng: number; address: string | null } | null>(null);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(""); setKind("friend"); setMode("current"); setQuery(""); setHits([]);
    setPicked(null); setPhone(""); setNotes("");
  }, [open]);

  const search = async () => {
    const q = query.trim();
    if (q.length < 3) { toast.error("Type at least 3 letters to search"); return; }
    setSearching(true);
    setHits([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as SearchHit[];
      setHits(data);
      if (data.length === 0) toast.info("No results. Try a nearby landmark or area name.");
    } catch {
      toast.error("Couldn't search right now. Check your internet or use your current location.");
    } finally {
      setSearching(false);
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Please give this place a name"); return; }
    const loc = mode === "current" ? { lat: pos.lat, lng: pos.lng, address: null } : picked;
    if (!loc) { toast.error("Search and pick a location first"); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setSaving(false); toast.error("Please sign in again"); return; }
    const { data, error } = await supabase
      .from("custom_safe_places")
      .insert({
        user_id: uid,
        name: trimmed.slice(0, 120),
        kind,
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address ? loc.address.slice(0, 300) : null,
        phone: phone.trim() ? phone.trim().slice(0, 30) : null,
        notes: notes.trim() ? notes.trim().slice(0, 500) : null,
      })
      .select("id,name,kind,lat,lng,address,phone,notes")
      .single();
    setSaving(false);
    if (error || !data) { toast.error("Couldn't save the place. Please try again."); return; }
    onSaved(data as MyPlace);
    toast.success("Safe place added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="safe-place-dialog max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a safe place</DialogTitle>
          <DialogDescription>Save a place you trust so you can find it quickly in an emergency.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">Name</Label>
            <Input id="sp-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya's house" />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    kind === k.value ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface"
                  }`}
                >{k.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" size="sm" variant={mode === "current" ? "brand" : "outline"} onClick={() => setMode("current")}>
                <LocateFixed className="h-4 w-4" /> I'm here now
              </Button>
              <Button type="button" size="sm" variant={mode === "search" ? "brand" : "outline"} onClick={() => setMode("search")}>
                <Search className="h-4 w-4" /> Search address
              </Button>
            </div>
            {mode === "current" ? (
              <p className="text-xs text-muted-foreground">
                Uses your current location ({pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}).
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
                    placeholder="Address, area or landmark"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={search} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {hits.length > 0 && (
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {hits.map((h, i) => {
                      const lat = parseFloat(h.lat), lng = parseFloat(h.lon);
                      const active = picked?.lat === lat && picked?.lng === lng;
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => setPicked({ lat, lng, address: h.display_name })}
                            className={`w-full rounded-xl border p-2 text-left text-xs ${active ? "border-brand bg-brand-soft" : "border-border"}`}
                          >{h.display_name}</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {picked && <p className="text-xs text-brand">Selected: {picked.address}</p>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sp-phone">Phone (optional)</Label>
            <Input id="sp-phone" type="tel" inputMode="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-notes">Notes (optional)</Label>
            <Textarea id="sp-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Gate code, open till 10 pm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="brand" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save place
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
