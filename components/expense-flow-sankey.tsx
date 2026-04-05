"use client";

import { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  entryTotalCost,
  formatWholeDollars,
  parseBillingYearMonth,
} from "@/lib/utils";
import { useStore } from "@/store/useStore";

const ANNUAL_ID = "annual";

function costLineKind(
  category: string,
): "variable" | "fixed" | "taxes" | "other" {
  const c = category.trim().toLowerCase();
  if (c === "variable") return "variable";
  if (c === "fixed") return "fixed";
  if (c === "taxes") return "taxes";
  return "other";
}

export function ExpenseFlowSankey({ year }: { year: number }) {
  const utilityEntries = useStore((s) => s.utilityEntries);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);

  const { sankeyData, labelById, empty } = useMemo(() => {
    if (utilityTypeDefinitions.length === 0) {
      return {
        sankeyData: null,
        labelById: {} as Record<string, string>,
        empty: "no-types" as const,
      };
    }

    const totalByUtility: Record<string, number> = {};
    const byCategory = {
      variable: 0,
      fixed: 0,
      taxes: 0,
      other: 0,
    };

    for (const entry of utilityEntries) {
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== year) continue;

      const entryTotal = entryTotalCost(entry);
      totalByUtility[entry.utility] =
        (totalByUtility[entry.utility] ?? 0) + entryTotal;

      for (const item of entry.costItems) {
        const k = costLineKind(item.category);
        byCategory[k] += item.totalCost;
      }
    }

    const yearTotal = Object.values(totalByUtility).reduce((a, b) => a + b, 0);
    if (yearTotal <= 0) {
      return {
        sankeyData: null,
        labelById: {} as Record<string, string>,
        empty: "no-costs" as const,
      };
    }

    const links: { source: string; target: string; value: number }[] = [];
    const labelMap: Record<string, string> = {
      [ANNUAL_ID]: "Annual expenses",
      "out-variable": "Variable",
      "out-fixed": "Fixed",
      "out-taxes": "Taxes",
      "out-other": "Other",
    };

    for (const def of utilityTypeDefinitions) {
      const uid = `u-${def.id}`;
      labelMap[uid] = def.label;
      const v = totalByUtility[def.id] ?? 0;
      if (v > 0) {
        links.push({ source: uid, target: ANNUAL_ID, value: v });
      }
    }

    const outputs: { id: string; key: keyof typeof byCategory }[] = [
      { id: "out-variable", key: "variable" },
      { id: "out-fixed", key: "fixed" },
      { id: "out-taxes", key: "taxes" },
      { id: "out-other", key: "other" },
    ];
    for (const o of outputs) {
      const v = byCategory[o.key];
      if (v > 0) {
        links.push({ source: ANNUAL_ID, target: o.id, value: v });
      }
    }

    const nodeIds = new Set<string>();
    for (const l of links) {
      nodeIds.add(l.source);
      nodeIds.add(l.target);
    }
    const nodes = [...nodeIds].map((id) => ({ id }));

    if (links.length === 0 || nodes.length < 2) {
      return {
        sankeyData: null,
        labelById: labelMap,
        empty: "no-costs" as const,
      };
    }

    return {
      sankeyData: { nodes, links },
      labelById: labelMap,
      empty: null as null,
    };
  }, [utilityEntries, utilityTypeDefinitions, year]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Expense flow</CardTitle>
        <CardDescription>
          How {year} costs by expense type roll up to annual total, then split
          by line-item category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {empty === "no-types" ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add expense types in Settings to see this chart.
          </p>
        ) : empty === "no-costs" ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recorded costs with a start date in {year}.
          </p>
        ) : sankeyData ? (
          <div className="h-[min(420px,70vh)] w-full min-h-[320px] min-w-0 overflow-x-auto">
            <div className="h-full min-h-[320px] min-w-[700px]">
              {/* Nivo default linkBlendMode is multiply — invisible on dark card backgrounds */}
              <ResponsiveSankey
                data={sankeyData}
                margin={{ top: 20, right: 140, bottom: 20, left: 200 }}
                align="justify"
                sort="input"
                layout="horizontal"
                nodeOpacity={1}
                nodeHoverOpacity={1}
                nodeThickness={12}
                nodeSpacing={24}
                nodeInnerPadding={4}
                nodeBorderWidth={0}
                linkOpacity={0.45}
                linkHoverOpacity={0.7}
                linkBlendMode="normal"
                enableLinkGradient={true}
                enableLabels={true}
                labelPadding={20}
                labelPosition="outside"
                labelOrientation="horizontal"
                label={(node) => labelById[node.id] ?? node.id}
                valueFormat={(v) =>
                  formatWholeDollars(typeof v === "number" ? v : Number(v))
                }
                theme={{
                  labels: {
                    text: {
                      fontSize: 12,
                      fill: "var(--foreground)",
                      fontWeight: 500,
                    },
                  },
                  tooltip: {
                    container: {
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    },
                  },
                }}
                colors={{ scheme: "set2" }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
