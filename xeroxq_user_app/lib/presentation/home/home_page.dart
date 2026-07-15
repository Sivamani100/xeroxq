import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:provider/provider.dart';
import 'package:open_file/open_file.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/vault_repository.dart';
import '../../data/shop_repository.dart';
import '../../data/job_repository.dart';
import '../vault/vault_page.dart';
import '../vault/scan_page.dart';
import '../shops/shop_map_page.dart';
import '../print/print_wizard_page.dart';
import '../print/job_tracking_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  List<VaultDocument> _recentDocs = [];
  List<Shop> _nearbyShops = [];
  List<PrintJob> _recentJobs = [];
  bool _loading = true;
  int _totalDocs = 0;
  int _usedBytes = 0;
  late AnimationController _heroController;
  late Animation<double> _heroFade;

  @override
  void initState() {
    super.initState();
    _heroController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _heroFade = CurvedAnimation(parent: _heroController, curve: Curves.easeOut);
    _loadData();
  }

  @override
  void dispose() {
    _heroController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final vaultRepo = context.read<VaultRepository>();
    final shopRepo = context.read<ShopRepository>();
    final jobRepo = context.read<JobRepository>();

    final recent = await vaultRepo.getRecentDocuments(limit: 6);
    final all = await vaultRepo.getDocuments();
    final shops = await shopRepo.fetchShops();
    final usedBytes = vaultRepo.totalUsedBytes();
    
    final history = await jobRepo.getCachedHistory();
    final uniqueJobs = <String, PrintJob>{};
    for (var job in history) {
      if (!uniqueJobs.containsKey(job.fileName)) {
        uniqueJobs[job.fileName] = job;
      }
    }
    final recentJobs = uniqueJobs.values.take(3).toList();

    if (mounted) {
      setState(() {
        _recentDocs = recent;
        _totalDocs = all.length;
        _nearbyShops = shops.where((s) => s.isOpen).take(3).toList();
        _recentJobs = recentJobs;
        _usedBytes = usedBytes;
        _loading = false;
      });
      _heroController.forward();
    }
  }

  void _showQuickReorderSheet(PrintJob oldJob) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final initialShop = _nearbyShops.firstWhere(
      (s) => s.id == oldJob.shopId,
      orElse: () => _nearbyShops.isNotEmpty ? _nearbyShops.first : Shop(
        id: oldJob.shopId,
        name: 'XeroxQ Partner',
        slug: 'partner',
        priceMono: 1.0,
        priceColor: 5.0,
        isOpen: true,
      ),
    );

    int copies = oldJob.preferences.copies;
    bool isColor = oldJob.preferences.color;
    Shop selectedShop = initialShop;
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            final rate = isColor ? selectedShop.priceColor : selectedShop.priceMono;
            final total = copies * oldJob.pageCount * rate;

            return Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(sheetContext).viewInsets.bottom + 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '⚡ Quick Re-order',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.borderDark.withValues(alpha: 0.3) : const Color(0xFFF5F5F7),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          oldJob.fileName.toLowerCase().endsWith('.pdf') ? Iconsax.document_text5 : Iconsax.image5,
                          color: AppColors.primary,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                oldJob.fileName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${oldJob.pageCount} pages • ${oldJob.preferences.doubleSided ? "Double-sided" : "Single-sided"}',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Color Print', style: TextStyle(fontWeight: FontWeight.bold)),
                      Switch(
                        value: isColor,
                        activeThumbColor: AppColors.primary,
                        onChanged: (val) {
                          setSheetState(() {
                            isColor = val;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Copies', style: TextStyle(fontWeight: FontWeight.bold)),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: copies > 1 ? () => setSheetState(() => copies--) : null,
                          ),
                          Text('$copies', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setSheetState(() => copies++),
                          ),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 12),

                  const Text('Print Shop', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<Shop>(
                    initialValue: selectedShop,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    items: _nearbyShops.map((s) {
                      return DropdownMenuItem<Shop>(
                        value: s,
                        child: Text(s.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setSheetState(() {
                          selectedShop = val;
                        });
                      }
                    },
                  ),
                  const Divider(height: 32),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Estimated Cost', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          Text(
                            '₹${total.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      submitting
                          ? const CircularProgressIndicator()
                          : ElevatedButton(
                              onPressed: () async {
                                setSheetState(() => submitting = true);
                                final jobRepo = context.read<JobRepository>();
                                final scaffoldMessenger = ScaffoldMessenger.of(context);
                                final navigator = Navigator.of(context);
                                
                                try {
                                  final newJob = await jobRepo.submitQuickReorder(
                                    oldJob: oldJob,
                                    shopId: selectedShop.id,
                                    color: isColor,
                                    copies: copies,
                                  );
                                  
                                  navigator.pop(); // Close sheet
                                  navigator.push(
                                    MaterialPageRoute(
                                      builder: (_) => JobTrackingPage(
                                        jobId: newJob.id,
                                        shop: selectedShop,
                                      ),
                                    ),
                                  );
                                } catch (e) {
                                  setSheetState(() => submitting = false);
                                  scaffoldMessenger.showSnackBar(
                                    SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: const Text('Confirm & Pay', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Max vault size shown in meter: 500 MB
  static const int _maxBytes = 500 * 1024 * 1024;

  String get _usedFormatted {
    if (_usedBytes < 1024 * 1024) {
      return '${(_usedBytes / 1024).toStringAsFixed(0)} KB';
    }
    return '${(_usedBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  double get _storagePercent => (_usedBytes / _maxBytes).clamp(0.0, 1.0);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : const Color(0xFFF5F5F7),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: RefreshIndicator(
                onRefresh: _loadData,
                child: CustomScrollView(
                  slivers: [
                    // ── Top header ──────────────────────────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Good ${_greeting()},',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: isDark
                                          ? AppColors.textSecondaryDark
                                          : AppColors.textSecondaryLight,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'XeroxQ',
                                    style: TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.8,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Scan shortcut
                            GestureDetector(
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const ScanPage())),
                              child: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  gradient: AppGradients.scan,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Iconsax.scan, color: Colors.white, size: 20),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Notification placeholder
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.cardDark : Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                    color: isDark ? AppColors.borderDark : AppColors.borderLight),
                              ),
                              child: Icon(Iconsax.notification,
                                  color: isDark
                                      ? AppColors.textPrimaryDark
                                      : AppColors.textPrimaryLight,
                                  size: 20),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ── Bento Grid ─────────────────────────────────────────
                    SliverToBoxAdapter(
                      child: FadeTransition(
                        opacity: _heroFade,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              // Row 1: Quick Print (large) + Vault (small)
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    flex: 13,
                                    child: _QuickPrintCard(shopCount: _nearbyShops.length),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    flex: 7,
                                    child: Column(
                                      children: [
                                        _BentoStatCard(
                                          gradient: AppGradients.vault,
                                          icon: Iconsax.folder_open,
                                          label: 'Vault',
                                          value: '$_totalDocs docs',
                                          onTap: () => Navigator.push(context,
                                              MaterialPageRoute(
                                                  builder: (_) => const VaultPage())),
                                        ),
                                        const SizedBox(height: 12),
                                        _BentoStatCard(
                                          gradient: AppGradients.shops,
                                          icon: Iconsax.shop,
                                          label: 'Shops',
                                          value: '${_nearbyShops.length} open',
                                          onTap: () => Navigator.push(context,
                                              MaterialPageRoute(
                                                  builder: (_) => const ShopMapPage())),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Row 2: Storage meter + Scanner + History
                              Row(
                                children: [
                                  // Storage meter card
                                  Expanded(
                                    child: _StorageMeterCard(
                                      usedFormatted: _usedFormatted,
                                      percent: _storagePercent,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Scan card
                                  Expanded(
                                    child: _BentoActionCard(
                                      gradient: AppGradients.scan,
                                      icon: Iconsax.scan,
                                      label: 'Scan Doc',
                                      subtitle: 'Camera → PDF',
                                      onTap: () => Navigator.push(context,
                                          MaterialPageRoute(
                                              builder: (_) => const ScanPage())),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Print Again card
                                  Expanded(
                                    child: _BentoActionCard(
                                      gradient: AppGradients.history,
                                      icon: Iconsax.clock,
                                      label: 'History',
                                      subtitle: 'Print jobs',
                                      onTap: () {
                                        // Switch to history tab via parent
                                        Navigator.of(context).popUntil((r) => r.isFirst);
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // ── Quick Re-order ───────────────────────────────────────
                    if (_recentJobs.isNotEmpty) ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
                          child: const Text(
                            'QUICK RE-ORDER',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 80,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _recentJobs.length,
                            itemBuilder: (context, index) {
                              final job = _recentJobs[index];
                              return _QuickReorderCard(
                                job: job,
                                isDark: isDark,
                                onTap: () => _showQuickReorderSheet(job),
                              );
                            },
                          ),
                        ),
                      ),
                    ],

                    // ── Recent Documents ───────────────────────────────────
                    if (_recentDocs.isNotEmpty) ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'RECENT DOCUMENTS',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.2,
                                  color: AppColors.textSecondaryLight,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => Navigator.push(context,
                                    MaterialPageRoute(builder: (_) => const VaultPage())),
                                child: const Text(
                                  'See All',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 130,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _recentDocs.length,
                            itemBuilder: (_, i) => _RecentDocCard(
                              doc: _recentDocs[i],
                              isDark: isDark,
                            ),
                          ),
                        ),
                      ),
                    ],

                    // ── Open Shops nearby ─────────────────────────────────
                    if (_nearbyShops.isNotEmpty) ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'OPEN SHOPS',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.2,
                                  color: AppColors.textSecondaryLight,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => Navigator.push(context,
                                    MaterialPageRoute(
                                        builder: (_) => const ShopMapPage())),
                                child: const Text(
                                  'View Map',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _ShopListTile(shop: _nearbyShops[i], isDark: isDark),
                          childCount: _nearbyShops.length,
                        ),
                      ),
                    ],

                    const SliverToBoxAdapter(child: SizedBox(height: 32)),
                  ],
                ),
              ),
            ),

      // FAB — quick print
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(context,
              MaterialPageRoute(builder: (_) => const PrintWizardPage()));
        },
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Iconsax.printer),
        label: const Text('PRINT', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Bento Card Widgets
// ──────────────────────────────────────────────────────────────────────────────

class _QuickPrintCard extends StatelessWidget {
  final int shopCount;
  const _QuickPrintCard({required this.shopCount});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
          context, MaterialPageRoute(builder: (_) => const PrintWizardPage())),
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          color: const Color(0xFFFFF0E6),
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF97316).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Iconsax.printer, color: Color(0xFFF97316), size: 22),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '$shopCount shops open',
                        style: const TextStyle(
                            color: AppColors.success,
                            fontSize: 10,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Spacer(),
            const Text(
              'START\nPRINTING',
              style: TextStyle(
                color: Color(0xFF1A1A2E),
                fontSize: 28,
                fontWeight: FontWeight.w900,
                height: 1.1,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text(
                  'Send docs to any shop',
                  style: TextStyle(
                      color: Color(0xFF8A7060), fontSize: 12, fontWeight: FontWeight.w500),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF97316).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Iconsax.arrow_right_3, color: Color(0xFFF97316), size: 16),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BentoStatCard extends StatelessWidget {
  final LinearGradient gradient;
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _BentoStatCard({
    required this.gradient,
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 94,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: gradient.colors.first == const Color(0xFFEBF0FF)
                ? const Color(0xFF3B82F6)
                : gradient.colors.first == const Color(0xFFE6FAF5)
                    ? const Color(0xFF10B981)
                    : const Color(0xFF1A1A2E),
                size: 22),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: const TextStyle(
                        color: Color(0xFF1A1A2E), fontSize: 14, fontWeight: FontWeight.w900)),
                Text(label,
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BentoActionCard extends StatelessWidget {
  final LinearGradient gradient;
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _BentoActionCard({
    required this.gradient,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon,
                color: gradient.colors.first == const Color(0xFFE6FFF5)
                    ? const Color(0xFF10B981)
                    : gradient.colors.first == const Color(0xFFE6F0FF)
                        ? const Color(0xFF3B82F6)
                        : const Color(0xFFF97316),
                size: 22),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: Color(0xFF1A1A2E), fontSize: 13, fontWeight: FontWeight.w900)),
                Text(subtitle,
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StorageMeterCard extends StatelessWidget {
  final String usedFormatted;
  final double percent;

  const _StorageMeterCard({required this.usedFormatted, required this.percent});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: 110,
      decoration: BoxDecoration(
        color: const Color(0xFFFFE8EE),
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(Iconsax.cpu, color: Color(0xFFE11D48), size: 20),
              CircularPercentIndicator(
                radius: 22,
                lineWidth: 4,
                percent: percent,
                backgroundColor: const Color(0x33E11D48),
                progressColor: const Color(0xFFE11D48),
                center: Text(
                  '${(percent * 100).toInt()}%',
                  style: const TextStyle(
                      color: Color(0xFFE11D48), fontSize: 9, fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(usedFormatted,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontSize: 13, fontWeight: FontWeight.w900)),
              const Text('Storage',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }
}

class _RecentDocCard extends StatelessWidget {
  final VaultDocument doc;
  final bool isDark;

  const _RecentDocCard({required this.doc, required this.isDark});

  IconData get _docIcon {
    switch (doc.extension) {
      case 'pdf':
        return Iconsax.document_text;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Iconsax.image;
      default:
        return Iconsax.document;
    }
  }

  Color get _docColor {
    switch (doc.extension) {
      case 'pdf':
        return AppColors.primary;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return AppColors.info;
      default:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.read<VaultRepository>().markRecentlyAccessed(doc.id);
        OpenFile.open(doc.localPath);
      },
      child: Container(
        width: 110,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _docColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_docIcon, color: _docColor, size: 20),
            ),
            const Spacer(),
            Text(
              doc.name,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 3),
            Text(
              doc.formattedSize,
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondaryLight),
            ),
            if (doc.isFavourite) ...[
              const SizedBox(height: 3),
              const Icon(Iconsax.star1, size: 12, color: AppColors.warning),
            ],
          ],
        ),
      ),
    );
  }
}

class _ShopListTile extends StatelessWidget {
  final Shop shop;
  final bool isDark;

  const _ShopListTile({required this.shop, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => PrintWizardPage(initialShop: shop))),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: AppGradients.shops,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Iconsax.shop, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    shop.name,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Mono ₹${shop.priceMono.toStringAsFixed(1)} · Color ₹${shop.priceColor.toStringAsFixed(1)}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondaryLight),
                  ),
                ],
              ),
            ),
            const Icon(Iconsax.printer, color: AppColors.primary, size: 20),
          ],
        ),
      ),
    );
  }
}

class _QuickReorderCard extends StatelessWidget {
  final PrintJob job;
  final bool isDark;
  final VoidCallback onTap;

  const _QuickReorderCard({
    required this.job,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final date = job.createdAt ?? DateTime.now();
    final formattedDate = DateFormat('dd MMM').format(date);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 220,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                job.fileName.toLowerCase().endsWith('.pdf') ? Iconsax.document_text5 : Iconsax.image5,
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    job.fileName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$formattedDate • ${job.pageCount} pgs',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const Icon(Icons.keyboard_arrow_right, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
