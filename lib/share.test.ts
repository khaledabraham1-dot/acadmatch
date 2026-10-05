import { describe, expect, it } from "vitest";
import { buildShareUrl, resultShareText, whatsappShareHref } from "@/lib/share";

describe("partage", () => {
  it("ajoute le canal au lien public, sans double barre oblique", () => {
    expect(buildShareUrl("https://acadmatch.example/", "/formations/f-x", "whatsapp")).toBe(
      "https://acadmatch.example/formations/f-x?utm_source=whatsapp&utm_medium=partage",
    );
  });

  it("encode le message et le lien pour WhatsApp", () => {
    const href = whatsappShareHref("Master « Data » & IA", "https://a.example/f?utm_source=whatsapp");
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(href.slice("https://wa.me/?text=".length))).toBe(
      "Master « Data » & IA\nhttps://a.example/f?utm_source=whatsapp",
    );
  });

  it("cite le score et la formation", () => {
    expect(resultShareText(72, "Master MoSIG", "Grenoble INP")).toContain("72/100");
  });
});
