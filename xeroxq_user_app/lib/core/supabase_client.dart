import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';

class SupabaseClientService {
  static final SupabaseClientService _instance = SupabaseClientService._internal();

  factory SupabaseClientService() {
    return _instance;
  }

  SupabaseClientService._internal();

  SupabaseClient get client => Supabase.instance.client;

  GoTrueClient get auth => client.auth;

  SupabaseStorageClient get storage => client.storage;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: Config.supabaseUrl,
      publishableKey: Config.supabaseAnonKey,
    );
  }
}
