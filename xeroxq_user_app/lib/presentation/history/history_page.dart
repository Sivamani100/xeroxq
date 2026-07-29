import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../data/job_repository.dart';
import '../../data/shop_repository.dart';
import '../../data/models.dart';
import '../print/print_wizard_page.dart';
import '../print/job_tracking_page.dart';

const Color _emerald = Color(0xFF10B981);

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<PrintJob> _historyJobs = [];
  bool _loading = true;
  Timer? _syncTimer;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    // Sync status from DB every 10 seconds silently
    _syncTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _syncHistoryQuietly();
    });
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }

  Future<void> _syncHistoryQuietly() async {
    final jobRepo = context.read<JobRepository>();
    final syncedList = await jobRepo.syncHistoryWithDatabase();
    if (mounted) {
      setState(() {
        _historyJobs = syncedList;
      });
    }
  }

  Future<void> _confirmDeleteJob(PrintJob job) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Print File?', style: TextStyle(fontWeight: FontWeight.w900)),
        content: const Text(
          'Are you sure you want to delete this print job and its uploaded file? This will remove it from the printer queue and history.',
          style: TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Deleting print file...'), duration: Duration(seconds: 1)),
      );
      
      await context.read<JobRepository>().deleteJobByUser(job.id);
      _loadHistory();
    }
  }

  Future<void> _loadHistory() async {
    setState(() => _loading = true);
    final jobRepo = context.read<JobRepository>();
    final cachedList = await jobRepo.getCachedHistory();
    setState(() {
      _historyJobs = cachedList;
      _loading = false;
    });

    // Synchronise with database in background
    final syncedList = await jobRepo.syncHistoryWithDatabase();
    if (mounted) {
      setState(() {
        _historyJobs = syncedList;
      });
    }
  }

  Future<void> _reorderJob(PrintJob job) async {
    final shopRepo = context.read<ShopRepository>();
    final allShops = await shopRepo.fetchShops();

    final shop = allShops.firstWhere(
      (s) => s.id == job.shopId,
      orElse: () => Shop(
        id: job.shopId,
        name: 'XeroxQ Shop',
        slug: 'partner',
        priceMono: 1.0,
        priceColor: 5.0,
        isOpen: true,
      ),
    );

    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PrintWizardPage(
            initialShop: shop,
          ),
        ),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return _emerald;
      case 'pending':
        return AppColors.primary;
      case 'processing':
        return Colors.blue;
      case 'printed':
        return Colors.teal;
      default:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F7),
      appBar: AppBar(
        title: const Text('PRINT HISTORY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: _loadHistory,
            tooltip: 'Refresh list',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _historyJobs.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.borderLight),
                          ),
                          child: Icon(Iconsax.clock, size: 40, color: Colors.grey[400]),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'No Print History Yet',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.grey),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Your digital print orders will appear here.',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _historyJobs.length,
                  itemBuilder: (context, index) {
                    final job = _historyJobs[index];
                    final date = job.createdAt ?? DateTime.now();
                    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(date);
                    final isColor = job.preferences.color;
                    final copies = job.preferences.copies;
                    final pages = job.pageCount;
                    
                    // Simple rate calculation for display
                    final rate = isColor ? 5.0 : 1.0;
                    final total = copies * pages * rate;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: const BorderSide(color: AppColors.borderLight),
                      ),
                      color: Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Expanded(
                                  child: Text(
                                    'XeroxQ Printer Partner',
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(job.status).withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        job.status.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                          color: _getStatusColor(job.status),
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                      onPressed: () => _confirmDeleteJob(job),
                                      constraints: const BoxConstraints(),
                                      padding: EdgeInsets.zero,
                                      tooltip: 'Delete print file',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              job.fileName,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$formattedDate • $pages pages • $copies copies',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryLight),
                            ),
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '₹${total.toStringAsFixed(2)}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                                ),
                                Row(
                                  children: [
                                    if (job.status.toLowerCase() != 'completed' &&
                                        job.status.toLowerCase() != 'cancelled' &&
                                        job.status.toLowerCase() != 'failed')
                                      TextButton.icon(
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => JobTrackingPage(
                                                jobId: job.id,
                                                shop: Shop(
                                                  id: job.shopId,
                                                  name: 'XeroxQ Shop',
                                                  slug: 'partner',
                                                  priceMono: 1.0,
                                                  priceColor: 5.0,
                                                  isOpen: true,
                                                ),
                                              ),
                                            ),
                                          );
                                        },
                                        icon: const Icon(Iconsax.radar_2, size: 16),
                                        label: const Text('Track', style: TextStyle(fontWeight: FontWeight.w700)),
                                        style: TextButton.styleFrom(
                                          foregroundColor: AppColors.primary,
                                        ),
                                      ),
                                    TextButton.icon(
                                      onPressed: () => _reorderJob(job),
                                      icon: const Icon(Iconsax.printer, size: 16),
                                      label: const Text('Print Again', style: TextStyle(fontWeight: FontWeight.w700)),
                                      style: TextButton.styleFrom(
                                        foregroundColor: Colors.black,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
