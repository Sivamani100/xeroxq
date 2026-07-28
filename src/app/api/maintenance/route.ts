export const dynamic = "force-static";

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    if (error) {
      console.error('Error fetching maintenance status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch maintenance status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      maintenance_mode: data?.value || false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Maintenance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maintenance_mode, admin_key } = body;

    // Verify admin key (you should use a proper authentication system)
    const expectedAdminKey = process.env.ADMIN_MAINTENANCE_KEY || 'xeroxq-admin-2024';
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin key' },
        { status: 401 }
      );
    }

    
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert(
        { key: 'maintenance_mode', value: maintenance_mode },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating maintenance mode:', error);
      return NextResponse.json(
        { error: 'Failed to update maintenance mode' },
        { status: 500 }
      );
    }

    // Log the maintenance mode change
    await supabase.from('admin_logs').insert({
      action: 'maintenance_mode_change',
      details: {
        old_value: !maintenance_mode,
        new_value: maintenance_mode,
        timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      maintenance_mode: data.value,
      message: maintenance_mode 
        ? 'Maintenance mode activated successfully' 
        : 'Maintenance mode deactivated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Maintenance POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
