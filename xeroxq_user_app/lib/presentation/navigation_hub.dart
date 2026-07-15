import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'home/home_page.dart';
import 'vault/vault_page.dart';
import 'shops/shop_map_page.dart';
import 'history/history_page.dart';

class NavigationHub extends StatefulWidget {
  const NavigationHub({super.key});

  @override
  State<NavigationHub> createState() => _NavigationHubState();
}

class _NavigationHubState extends State<NavigationHub> {
  int _currentIndex = 0;

  static const List<Widget> _pages = [
    HomePage(),
    VaultPage(),
    ShopMapPage(),
    HistoryPage(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.06),
              blurRadius: 30,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Iconsax.home),
              activeIcon: Icon(Iconsax.home_2),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Iconsax.folder),
              activeIcon: Icon(Iconsax.folder_open),
              label: 'Vault',
            ),
            BottomNavigationBarItem(
              icon: Icon(Iconsax.shop),
              activeIcon: Icon(Iconsax.location),
              label: 'Shops',
            ),
            BottomNavigationBarItem(
              icon: Icon(Iconsax.clock),
              activeIcon: Icon(Iconsax.timer_1),
              label: 'History',
            ),
          ],
        ),
      ),
    );
  }
}
