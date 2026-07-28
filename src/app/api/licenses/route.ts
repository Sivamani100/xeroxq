import { NextResponse } from "next/server";
import licensesData from "../../../../public/licenses.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase() || "";
  const ecosystem = searchParams.get("ecosystem") || "";
  const licenseType = searchParams.get("license") || "";

  let filtered = licensesData.licenses;

  if (query) {
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query)
    );
  }

  if (ecosystem && ecosystem !== "All") {
    filtered = filtered.filter((item) => item.ecosystem.toLowerCase() === ecosystem.toLowerCase());
  }

  if (licenseType && licenseType !== "All") {
    filtered = filtered.filter((item) => item.license.toLowerCase() === licenseType.toLowerCase());
  }

  return NextResponse.json({
    project: licensesData.project,
    version: licensesData.version,
    lastAudited: licensesData.lastAudited,
    complianceStatus: licensesData.complianceStatus,
    totalDependencies: licensesData.totalDependencies,
    returnedCount: filtered.length,
    licenses: filtered,
  });
}
