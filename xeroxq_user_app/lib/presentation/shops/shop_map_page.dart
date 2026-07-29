import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/shop_repository.dart';
import '../print/print_wizard_page.dart';

// Emerald green color (not available in Flutter Colors class)
const Color _emerald = Color(0xFF10B981);

class ShopMapPage extends StatefulWidget {
  const ShopMapPage({super.key});

  @override
  State<ShopMapPage> createState() => _ShopMapPageState();
}

class _ShopMapPageState extends State<ShopMapPage> {
  final MapController _mapController = MapController();
  LatLng _userPosition = const LatLng(13.6276, 79.4005); // Default (Tirupati)
  bool _positionFetched = false;
  List<Shop> _shops = [];
  List<Shop> _filteredShops = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _determinePosition().then((pos) {
      if (pos != null) {
        setState(() {
          _userPosition = LatLng(pos.latitude, pos.longitude);
          _positionFetched = true;
        });
        _mapController.move(_userPosition, 14.0);
      }
    });
    _loadShops();
  }

  Future<Position?> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return null;
      }
      
      if (permission == LocationPermission.deniedForever) return null;

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 5),
      );
    } catch (e) {
      debugPrint('Location fetch error: $e');
      return null;
    }
  }

  Future<void> _loadShops() async {
    final repo = context.read<ShopRepository>();
    final list = await repo.fetchShops();
    setState(() {
      _shops = list;
      _filteredShops = list;
      _loading = false;
    });
  }

  void _filterShops(String val) {
    setState(() {
      _filteredShops = _shops.where((shop) {
        final matchesName = shop.name.toLowerCase().contains(val.toLowerCase());
        final matchesAddress = (shop.shopLocation ?? '').toLowerCase().contains(val.toLowerCase());
        return matchesName || matchesAddress;
      }).toList();
    });
  }

  double _calculateDistance(double lat, double lng) {
    return Geolocator.distanceBetween(
      _userPosition.latitude,
      _userPosition.longitude,
      lat,
      lng,
    ) / 1000.0; // In km
  }

  void _showShopDetails(Shop shop) {
    final distance = shop.shopLat != null && shop.shopLng != null
        ? _calculateDistance(shop.shopLat!, shop.shopLng!)
        : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _ShopDetailsBottomSheet(shop: shop, distance: distance);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DISCOVER SHOPS'),
      ),
      body: Stack(
        children: [
          // OpenStreetMap Layer
          _loading
              ? const Center(child: CircularProgressIndicator())
              : FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _userPosition,
                    initialZoom: 13.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                      subdomains: const ['a', 'b', 'c'],
                    ),
                    
                    // User Position Marker
                    if (_positionFetched)
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: _userPosition,
                            width: 30,
                            height: 30,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.blue.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.blue, width: 2),
                              ),
                              child: Center(
                                child: Container(
                                  width: 12,
                                  height: 12,
                                  decoration: const BoxDecoration(
                                    color: Colors.blue,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                    // Shop Markers
                    MarkerLayer(
                      markers: _filteredShops
                          .where((s) => s.shopLat != null && s.shopLng != null)
                          .map((s) {
                        return Marker(
                          point: LatLng(s.shopLat!, s.shopLng!),
                          width: 48,
                          height: 48,
                          child: GestureDetector(
                            onTap: () => _showShopDetails(s),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              decoration: BoxDecoration(
                                color: s.isOpen ? AppColors.primary : Colors.grey,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: (s.isOpen ? AppColors.primary : Colors.grey).withValues(alpha: 0.4),
                                    blurRadius: 10,
                                    spreadRadius: 2,
                                  )
                                ],
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: const Icon(
                                Iconsax.printer,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),

          // Search Bar overlay
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 5),
                  )
                ],
                border: Border.all(color: Colors.grey[200]!),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Icon(Iconsax.search_normal, color: Colors.grey),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      onChanged: _filterShops,
                      decoration: const InputDecoration(
                        hintText: 'Search printing shops...',
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // GPS Location floating button
          Positioned(
            bottom: 24,
            right: 16,
            child: FloatingActionButton(
              onPressed: () {
                _determinePosition().then((pos) {
                  if (pos != null) {
                    setState(() {
                      _userPosition = LatLng(pos.latitude, pos.longitude);
                      _positionFetched = true;
                    });
                    _mapController.move(_userPosition, 15.0);
                  }
                });
              },
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: const Icon(Iconsax.gps),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShopDetailsBottomSheet extends StatefulWidget {
  final Shop shop;
  final double? distance;

  const _ShopDetailsBottomSheet({required this.shop, this.distance});

  @override
  State<_ShopDetailsBottomSheet> createState() => _ShopDetailsBottomSheetState();
}

class _ShopDetailsBottomSheetState extends State<_ShopDetailsBottomSheet> {
  int _calcPages = 10;

  @override
  Widget build(BuildContext context) {
    final totalMono = _calcPages * widget.shop.priceMono;
    final totalColor = _calcPages * widget.shop.priceColor;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32),
          topRight: Radius.circular(32),
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 48,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  widget.shop.name,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: widget.shop.isOpen
                      ? _emerald.withValues(alpha: 0.1)
                      : Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: widget.shop.isOpen ? _emerald : Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      widget.shop.isOpen ? 'OPEN' : 'CLOSED',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: widget.shop.isOpen ? _emerald : Colors.red,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (widget.distance != null)
            Text(
              '${widget.distance!.toStringAsFixed(1)} km away • ${widget.shop.shopLocation ?? ""}',
              style: const TextStyle(color: AppColors.textSecondaryLight, fontSize: 13, fontStyle: FontStyle.italic),
            ),
          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 12),
          const Text(
            'PRICING SCHEME',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.0),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildPricingCard(
                  title: 'Black & White',
                  price: '₹${widget.shop.priceMono.toStringAsFixed(2)} / page',
                  icon: Iconsax.ghost,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildPricingCard(
                  title: 'Color Print',
                  price: '₹${widget.shop.priceColor.toStringAsFixed(2)} / page',
                  icon: Iconsax.book,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 12),
          const Text(
            'COST ESTIMATOR',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.0),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Pages count to print:', style: TextStyle(fontWeight: FontWeight.bold)),
              Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (_calcPages > 1) setState(() => _calcPages--);
                    },
                    icon: const Icon(Iconsax.book),
                  ),
                  Text('$_calcPages', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                  IconButton(
                    onPressed: () => setState(() => _calcPages++),
                    icon: const Icon(Iconsax.add_square),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Mono Cost: ₹${totalMono.toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, color: AppColors.textSecondaryLight)),
              Text('Color Cost: ₹${totalColor.toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: !widget.shop.isOpen
                  ? null
                  : () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PrintWizardPage(
                            initialShop: widget.shop,
                          ),
                        ),
                      );
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                disabledBackgroundColor: Colors.grey[300],
              ),
              child: const Text(
                'PRINT DOCUMENTS HERE',
                style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildPricingCard({
    required String title,
    required String price,
    required IconData icon,
    Color color = Colors.black,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryLight, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 2),
              Text(
                price,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: color),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
