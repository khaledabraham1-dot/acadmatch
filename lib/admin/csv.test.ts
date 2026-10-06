import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/admin/csv";

describe("export CSV", () => {
  it("neutralise les formules saisies par un visiteur", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(csvCell("+33 6")).toBe("'+33 6");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
  it("échappe séparateurs, guillemets et retours à la ligne", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell("ligne\nsuivante")).toBe('"ligne\nsuivante"');
    expect(csvCell(null)).toBe("");
  });
  it("produit un fichier lisible par Excel (BOM, ; , CRLF)", () => {
    expect(toCsv(["Formation", "Demandes"], [["Master Économie", 3]])).toBe("\uFEFFFormation;Demandes\r\nMaster Économie;3\r\n");
  });
});
