import guardianArt from "@/assets/abhaya-guardian-background.png.asset.json";

export function SafetyBackdrop() {
  return (
    <div className="safety-art" aria-hidden="true">
      <img src={guardianArt.url} alt="" decoding="async" />
    </div>
  );
}