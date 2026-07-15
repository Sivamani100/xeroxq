import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:device_preview/device_preview.dart';
import 'core/local_storage.dart';
import 'core/supabase_client.dart';
import 'core/theme.dart';
import 'data/shop_repository.dart';
import 'data/vault_repository.dart';
import 'data/job_repository.dart';
import 'presentation/navigation_hub.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive local storage (must come before Supabase)
  await LocalStorageService.initialize();

  // Initialize Supabase (online features — optional / graceful fallback)
  try {
    await SupabaseClientService.initialize();
    debugPrint('Supabase initialised successfully.');
  } catch (e) {
    debugPrint('Failed to initialize Supabase (offline/demo mode): $e');
  }

  runApp(
    DevicePreview(
      enabled: !kReleaseMode,
      builder: (context) => const XeroxQUserApp(),
    ),
  );
}

class XeroxQUserApp extends StatelessWidget {
  const XeroxQUserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ShopRepository>(create: (_) => ShopRepository()),
        Provider<VaultRepository>(create: (_) => VaultRepository()),
        Provider<JobRepository>(create: (_) => JobRepository()),
      ],
      child: MaterialApp(
        title: 'XeroxQ Customer',
        debugShowCheckedModeBanner: false,
        locale: DevicePreview.locale(context),
        builder: DevicePreview.appBuilder,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const NavigationHub(),
      ),
    );
  }
}
