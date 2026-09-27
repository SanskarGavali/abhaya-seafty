import { supabase } from "@/integrations/supabase/client";
import type { Incident } from "./models";

export interface IncidentDraft {
  category: string;
  description: string;
  occurred_at: string; // ISO
  latitude: number | null;
  longitude: number | null;
  address: string;
  contact_ref: string;
  notes: string;
  evidence_ids: string[];
}

function makeCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ABH-${ymd}-${rand}`;
}

export async function listMyReports(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incident_reports")
    .select("*")
    .eq("is_emergency", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load your reports.");
  return (data ?? []) as unknown as Incident[];
}

export async function getReport(id: string): Promise<Incident | null> {
  const { data, error } = await supabase.from("incident_reports").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load this report.");
  return (data as unknown as Incident) ?? null;
}

export async function saveReport(draft: IncidentDraft, status: "draft" | "submitted"): Promise<Incident> {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("You're offline. Connect to the internet and try again.");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Please sign in again.");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("incident_reports")
    .insert({
      user_id: u.user.id,
      category: draft.category,
      description: draft.description || null,
      notes: draft.notes || null,
      occurred_at: draft.occurred_at,
      latitude: draft.latitude,
      longitude: draft.longitude,
      address: draft.address || null,
      contact_ref: draft.contact_ref || null,
      evidence_ids: draft.evidence_ids,
      status,
      submitted_at: status === "submitted" ? now : null,
      report_code: makeCode(),
      is_emergency: false,
      trigger_method: "Manual report",
    })
    .select("*")
    .single();
  if (error) throw new Error(`Could not save the report: ${error.message}`);
  if (draft.evidence_ids.length) {
    await supabase.from("evidence_items").update({ incident_id: data.id }).in("id", draft.evidence_ids);
  }
  return data as unknown as Incident;
}

export async function submitDraft(id: string) {
  const { error } = await supabase.from("incident_reports").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Could not submit this draft.");
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from("incident_reports").delete().eq("id", id);
  if (error) throw new Error("Could not delete this report.");
}
