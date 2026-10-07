import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// User-supplied links only; not saved to personal places or nearby-provider results.
const temporaryPlaces = [
  {
    name: "Nashik City Centre Mall",
    address: "Untwadi Road, Lavate Nagar, Parijat Nagar, Nashik, Maharashtra 422002",
    url: "https://maps.app.goo.gl/qqz5pEpzevxdpw266?g_st=ac",
  },
  {
    name: "ISKCON Sri Sri Radha Madan Gopal Mandir — Nashik",
    address: "Poornima Stop, Vrindavan Colony, Hare Krishna Road, Gen. Vaidya Nagar, Dwarka, Nashik, Maharashtra 422011",
    url: "https://maps.app.goo.gl/EBojZ7GoC4sUrhS57",
  },
];

export function TemporarySharedPlaces() {
  return (
    <section className="mx-auto max-w-lg space-y-3 px-4 pt-6" aria-labelledby="temporary-places-title">
      <h2 id="temporary-places-title" className="text-lg font-semibold text-brand-foreground">Temporarily shared places</h2>
      <ul className="space-y-3">
        {temporaryPlaces.map((place) => (
          <li key={place.url} className="place-card bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="safety-icon flex h-10 w-10 shrink-0 items-center justify-center"><MapPin className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="place-name text-sm font-semibold">{place.name}</h3>
                <p className="text-xs text-muted-foreground">{place.address}</p>
                <p className="text-xs text-muted-foreground">User-shared · Safety not verified</p>
                <Button asChild variant="brand" size="sm">
                  <a href={place.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open Maps</a>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}