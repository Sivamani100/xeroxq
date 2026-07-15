import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme.dart';
import '../../data/shop_repository.dart';
import '../../data/models.dart';
import '../print/print_wizard_page.dart';

class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> with SingleTickerProviderStateMixin {
  final ImagePicker _picker = ImagePicker();
  List<Shop> _shops = [];
  bool _loadingShops = true;
  late AnimationController _laserController;
  late Animation<double> _laserAnimation;
  final TextEditingController _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadShops();
    
    _laserController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    
    _laserAnimation = Tween<double>(begin: 0.0, end: 280.0).animate(_laserController);
  }

  @override
  void dispose() {
    _laserController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _loadShops() async {
    try {
      final shopRepo = context.read<ShopRepository>();
      final list = await shopRepo.fetchShops();
      setState(() {
        _shops = list;
        _loadingShops = false;
      });
    } catch (e) {
      debugPrint('Error loading shops: $e');
      setState(() {
        _loadingShops = false;
      });
    }
  }

  Future<void> _scanFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        _simulateSuccessfulScan();
      }
    } catch (e) {
      debugPrint('Error picking QR: $e');
    }
  }

  void _simulateSuccessfulScan({Shop? selectedShop}) {
    final targetShop = selectedShop ?? (_shops.isNotEmpty ? _shops.first : null);
    if (targetShop == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No shops available to connect.')),
      );
      return;
    }
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.qr_code_scanner, color: AppColors.primary),
              SizedBox(width: 10),
              Text('QR Code Detected', style: TextStyle(fontWeight: FontWeight.w900)),
            ],
          ),
          content: Text('Connected successfully to ${targetShop.name}. Do you want to start printing?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx); // Close dialog
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => PrintWizardPage(initialShop: targetShop)),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              child: const Text('Start Print'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('SCAN SHOP QR', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Iconsax.arrow_left_2, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          // Viewfinder area center
          Align(
            alignment: const Alignment(0, -0.35),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: Stack(
                    children: [
                      _buildViewfinderCorners(),
                      _buildScanningLaser(),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Point camera at the XeroxQ counter QR code',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Instantly connects you to the printer queue',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          
          // Bottom controls panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Manual Connection',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  
                  // Shop Code Input Row
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _codeController,
                          decoration: InputDecoration(
                            hintText: 'Enter Shop Code (e.g. SHOP01)',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () {
                          final code = _codeController.text.trim().toLowerCase();
                          final match = _shops.firstWhere(
                            (s) => s.slug.toLowerCase() == code || s.name.toLowerCase().contains(code),
                            orElse: () => _shops.isNotEmpty ? _shops.first : Shop(
                              id: '1',
                              name: 'XeroxQ Partner',
                              slug: 'partner',
                              priceMono: 1.0,
                              priceColor: 5.0,
                              isOpen: true,
                            ),
                          );
                          _simulateSuccessfulScan(selectedShop: match);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Connect', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const Divider(height: 36),
                  
                  // Nearby shops selection
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Select Nearby Printer',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                      TextButton.icon(
                        onPressed: _scanFromGallery,
                        icon: const Icon(Iconsax.gallery, size: 16, color: AppColors.primary),
                        label: const Text(
                          'Upload QR',
                          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                        style: TextButton.styleFrom(padding: EdgeInsets.zero),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  SizedBox(
                    height: 85,
                    child: _loadingShops
                        ? const Center(child: CircularProgressIndicator())
                        : _shops.isEmpty
                            ? const Center(child: Text('No shops nearby', style: TextStyle(color: Colors.grey, fontSize: 12)))
                            : ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: _shops.length,
                                itemBuilder: (context, index) {
                                  final shop = _shops[index];
                                  return GestureDetector(
                                    onTap: () => _simulateSuccessfulScan(selectedShop: shop),
                                    child: Container(
                                      width: 140,
                                      margin: const EdgeInsets.only(right: 12),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.borderDark.withValues(alpha: 0.2) : const Color(0xFFF5F5F7),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            shop.name,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Mono ₹${shop.priceMono.toStringAsFixed(0)}',
                                            style: const TextStyle(color: Colors.grey, fontSize: 11),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewfinderCorners() {
    const double thickness = 4.0;
    const double length = 24.0;
    const Color color = AppColors.primary;

    return Stack(
      children: [
        Positioned(top: 0, left: 0, child: Container(width: length, height: thickness, color: color)),
        Positioned(top: 0, left: 0, child: Container(width: thickness, height: length, color: color)),
        Positioned(top: 0, right: 0, child: Container(width: length, height: thickness, color: color)),
        Positioned(top: 0, right: 0, child: Container(width: thickness, height: length, color: color)),
        Positioned(bottom: 0, left: 0, child: Container(width: length, height: thickness, color: color)),
        Positioned(bottom: 0, left: 0, child: Container(width: thickness, height: length, color: color)),
        Positioned(bottom: 0, right: 0, child: Container(width: length, height: thickness, color: color)),
        Positioned(bottom: 0, right: 0, child: Container(width: thickness, height: length, color: color)),
      ],
    );
  }

  Widget _buildScanningLaser() {
    return AnimatedBuilder(
      animation: _laserAnimation,
      builder: (context, child) {
        return Positioned(
          top: _laserAnimation.value,
          left: 4,
          right: 4,
          child: Container(
            height: 3,
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.8),
                  blurRadius: 8,
                  spreadRadius: 2,
                )
              ],
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.1),
                  AppColors.primary,
                  AppColors.primary.withValues(alpha: 0.1),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
