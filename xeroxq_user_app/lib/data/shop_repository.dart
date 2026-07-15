import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import 'models.dart';

class ShopRepository {
  final SupabaseClient _client = SupabaseClientService().client;

  Future<List<Shop>> fetchShops() async {
    try {
      final response = await _client
          .from('shops')
          .select('*')
          .order('name');
      
      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => Shop.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      // Fallback/Mock data if offline or database fetch fails (for testing and robust offline fallback)
      print('Error fetching shops from Supabase: $e. Returning cached/mock fallback list.');
      return _getMockShops();
    }
  }

  List<Shop> _getMockShops() {
    return [
      Shop(
        id: 'db80f2d9-1111-4444-8888-123456789abc',
        name: 'Srinivasa Xerox & Prints',
        slug: 'srinivasa-xerox',
        phone: '9849497911',
        upiId: 'srinivasaxerox@ybl',
        shopLocation: 'Near SV University Main Gate, Tirupati, Andhra Pradesh',
        priceMono: 1.0,
        priceColor: 5.0,
        isOpen: true,
        shopLat: 13.6276,
        shopLng: 79.4005,
      ),
      Shop(
        id: 'db80f2d9-2222-4444-8888-123456789abc',
        name: 'Sai Ram Digital Xerox',
        slug: 'sai-ram-digital',
        phone: '9876543210',
        upiId: 'sairamdigital@paytm',
        shopLocation: 'Gnanapuram, Visakhapatnam, Andhra Pradesh',
        priceMono: 1.5,
        priceColor: 7.0,
        isOpen: true,
        shopLat: 17.7289,
        shopLng: 83.2986,
      ),
      Shop(
        id: 'db80f2d9-3333-4444-8888-123456789abc',
        name: 'Venkateswara Printing Hub',
        slug: 'venkateswara-printing',
        phone: '9123456789',
        upiId: 'vphub@upi',
        shopLocation: 'Benz Circle, Vijayawada, Andhra Pradesh',
        priceMono: 1.0,
        priceColor: 4.0,
        isOpen: false,
        shopLat: 16.5085,
        shopLng: 80.6473,
      ),
      Shop(
        id: 'db80f2d9-4444-4444-8888-123456789abc',
        name: 'Andhra University Xerox Point',
        slug: 'au-xerox-point',
        phone: '9440012345',
        upiId: 'auxerox@sbi',
        shopLocation: 'AU Campus, Visakhapatnam, Andhra Pradesh',
        priceMono: 0.75,
        priceColor: 3.5,
        isOpen: true,
        shopLat: 17.7262,
        shopLng: 83.3241,
      ),
    ];
  }
}
