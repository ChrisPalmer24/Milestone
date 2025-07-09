import { describe, it, test, expect } from "vitest";

import { getPortfolioValueHistoryForAssets } from "./assets";
import { AssetWithHistory } from "@shared/schema";

describe("getPortfolioValueHistoryForAssets", () => {
  it("returns correct portfolio history for a single asset with two values", async () => {
    const asset: AssetWithHistory = {
      id: "asset-1",
      history: [
        {
          id: "v1",
          assetId: "asset-1",
          value: 100,
          recordedAt: new Date("2024-01-01T00:00:00Z"),
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: "v2",
          assetId: "asset-1",
          value: 150,
          recordedAt: new Date("2024-01-02T00:00:00Z"),
          createdAt: new Date("2024-01-02T00:00:00Z"),
          updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
      ],
    };

    const result = await getPortfolioValueHistoryForAssets([asset]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeDefined();
    expect(result[1]).toBeDefined();
    if (result[0] && result[1]) {
      expect(result[0].date.toISOString().split("T")[0]).toBe("2024-01-01");
      expect(result[0].value).toBe(100);
      expect(result[1].date.toISOString().split("T")[0]).toBe("2024-01-02");
      expect(result[1].value).toBe(150);
    }
  });
});
