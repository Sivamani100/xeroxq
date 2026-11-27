import { NextResponse } from "next/server";
import { isMaintenanceEnabled } from "@/lib/maintenance";
import { getSupabaseAdmin, isAuthorizedCeo, timingSafeSecretMatch } from "@/lib/server-supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single();

    if (error) {
      console.error("[Maintenance GET]", error.message);
      return NextResponse.json({ error: "Failed to fetch maintenance status" }, { status: 500 });
    }

    return NextResponse.json({
      maintenance_mode: isMaintenanceEnabled(data?.value),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Maintenance GET error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { maintenance_mode, admin_key } = body ?? {};

    // Authorize via either verified CEO Bearer JWT OR server-only ADMIN_MAINTENANCE_KEY
    let authorized = false;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (isAuthorizedCeo(user)) {
        authorized = true;
      }
    }

    const expectedAdminKey = process.env.ADMIN_MAINTENANCE_KEY;
    if (!authorized && timingSafeSecretMatch(admin_key, expectedAdminKey)) {
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nextValue = Boolean(maintenance_mode);
    const { data, error } = await supabase
      .from("platform_settings")
      .upsert(
        { key: "maintenance_mode", value: nextValue },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      console.error("[Maintenance POST error]", error.message);
      return NextResponse.json({ error: "Failed to update maintenance mode" }, { status: 500 });
    }

    // Log to automation_logs (exists in schema; avoid missing admin_logs table)
    await supabase.from("automation_logs").insert({
      event_type: "MAINTENANCE_TOGGLE",
      details: {
        old_value: !nextValue,
        new_value: nextValue,
        timestamp: new Date().toISOString(),
      },
      severity: nextValue ? "warning" : "info",
    });

    return NextResponse.json({
      success: true,
      maintenance_mode: isMaintenanceEnabled(data?.value),
      message: nextValue
        ? "Maintenance mode activated successfully"
        : "Maintenance mode deactivated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Maintenance POST error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
