import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import 'models.dart';

class ShopRepository {
  final SupabaseClient _client = SupabaseClientService().client;

  Future<List<Shop>> fetchShops() async {
    final response = await _client
        .from('shops')
        .select(
          'id, name, slug, phone, upi_id, shop_location, price_mono, price_color, is_open, is_active, approval_status, total_files_processed, shop_lat, shop_lng',
        )
        .eq('is_active', true)
        .order('name');

    final List<dynamic> data = response as List<dynamic>;
    return data.map((json) => Shop.fromJson(json as Map<String, dynamic>)).toList();
  }
}
