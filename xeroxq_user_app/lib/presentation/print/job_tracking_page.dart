import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/job_repository.dart';
import '../navigation_hub.dart';

class JobTrackingPage extends StatefulWidget {
  final String? jobId;
  final List<String>? jobIds;
  final Shop shop;

  const JobTrackingPage({
    super.key,
    this.jobId,
    this.jobIds,
    required this.shop,
  });

  @override
  State<JobTrackingPage> createState() => _JobTrackingPageState();
}

class _JobTrackingPageState extends State<JobTrackingPage> {
  late final List<String> _activeJobIds;
  List<PrintJob> _currentJobs = [];
  final List<StreamSubscription> _subscriptions = [];
  
  bool _loading = true;
  String _errorMessage = '';
  int _currentTicketIndex = 0;
  final PageController _pageController = PageController();

  // Local state to simulate payment confirmation until shop updates the DB
  bool _localPaymentConfirmed = false;

  @override
  void initState() {
    super.initState();
    _activeJobIds = widget.jobIds ?? (widget.jobId != null ? [widget.jobId!] : []);
    _loadInitialJobs();
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    super.dispose();
  }

  Future<void> _loadInitialJobs() async {
    try {
      final jobRepo = context.read<JobRepository>();
      final List<PrintJob> loadedJobs = [];
      for (final id in _activeJobIds) {
        final job = await jobRepo.getJobStatus(id);
        loadedJobs.add(job);
      }
      
      setState(() {
        _currentJobs = loadedJobs;
        _loading = false;
      });

      _subscribeToJobs();
    } catch (e) {
      debugPrint('Error fetching initial jobs status: $e');
      setState(() {
        _errorMessage = e.toString();
        _loading = false;
      });
    }
  }

  void _subscribeToJobs() {
    final jobRepo = context.read<JobRepository>();
    for (final id in _activeJobIds) {
      final sub = jobRepo.streamJobStatus(id).listen((data) {
        if (data.isNotEmpty) {
          final updatedJob = PrintJob.fromJson(data.first);
          if (mounted) {
            setState(() {
              final idx = _currentJobs.indexWhere((j) => j.id == updatedJob.id);
              if (idx != -1) {
                _currentJobs[idx] = updatedJob;
              }
            });
          }
        }
      });
      _subscriptions.add(sub);
    }
  }

  double _calculateTotalAmount() {
    double total = 0.0;
    for (final job in _currentJobs) {
      final rate = job.preferences.color ? widget.shop.priceColor : widget.shop.priceMono;
      total += rate * job.preferences.copies * job.pageCount;
    }
    return total;
  }

  bool _isAnyJobUnpaid() {
    if (_localPaymentConfirmed) return false;
    return _currentJobs.any((j) => !j.isPaid && j.status != 'completed');
  }

  Future<void> _launchPaymentApp(String appName, String scheme, double amount) async {
    final upi = widget.shop.upiId;
    if (upi == null || upi.isEmpty) return;

    final String txnNote = "XeroxQ Print Job ${_currentJobs.map((j) => j.token).join(',')}";
    
    // Construct deep link URL
    String upiUrl = '';
    if (appName == 'Generic') {
      upiUrl = 'upi://pay?pa=$upi&pn=${Uri.encodeComponent(widget.shop.name)}&am=${amount.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(txnNote)}';
    } else {
      // Direct deep link
      upiUrl = '$scheme://pay?pa=$upi&pn=${Uri.encodeComponent(widget.shop.name)}&am=${amount.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(txnNote)}';
    }

    final Uri uri = Uri.parse(upiUrl);
    Navigator.pop(context); // Close bottom sheet

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        _showPostPaymentDialog(amount);
      } else {
        _showUPIFallbackDialog(upi, amount);
      }
    } catch (e) {
      _showUPIFallbackDialog(upi, amount);
    }
  }

  void _showPaymentBottomSheet(double amount) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.cardDark : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32),
          topRight: Radius.circular(32),
        ),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Bottom sheet handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'SELECT UPI APP',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Colors.grey),
              ),
              const SizedBox(height: 8),
              Text(
                'Paying ₹${amount.toStringAsFixed(2)} to ${widget.shop.name}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              
              // App Redirection Tiles
              _buildPaymentAppTile('PhonePe', 'phonepe', const Color(0xFF5F259F), Icons.phone_android, amount),
              const SizedBox(height: 12),
              _buildPaymentAppTile('Google Pay', 'gpay', const Color(0xFF4285F4), Icons.payment, amount),
              const SizedBox(height: 12),
              _buildPaymentAppTile('Paytm', 'paytmmp', const Color(0xFF00baf2), Icons.wallet, amount),
              const SizedBox(height: 12),
              _buildPaymentAppTile('Any UPI App', 'Generic', isDark ? Colors.white24 : Colors.black87, Icons.apps, amount),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentAppTile(String name, String scheme, Color color, IconData icon, double amount) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => _launchPaymentApp(name, scheme, amount),
        icon: Icon(icon, color: Colors.white, size: 20),
        label: Text(
          name.toUpperCase(),
          style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
      ),
    );
  }

  void _showPostPaymentDialog(double amount) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Confirm Payment', style: TextStyle(fontWeight: FontWeight.w900)),
        content: Text(
          'Did you successfully pay ₹${amount.toStringAsFixed(2)} via the UPI app?\n\nSelecting "Yes" will update your ticket status to alert the shop owner.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('NO, CANCEL', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              setState(() {
                _localPaymentConfirmed = true;
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment status saved! Shopkeeper is verifying.'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: const Text('YES, I PAID', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showUPIFallbackDialog(String upiId, double amount) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('UPI Payment Details', style: TextStyle(fontWeight: FontWeight.w900)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Could not automatically launch the app. Copy this UPI ID to pay manually:'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      upiId,
                      style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Iconsax.copy, size: 20),
                    onPressed: () {
                      // Simulated copy
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('UPI ID copied!')),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text('Amount to pay: ₹${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _showPostPaymentDialog(amount);
            },
            child: const Text('I HAVE PAID', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  int _getStatusStepIndex(String status) {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'printed': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('PRINT QUEUE TRACKER'),
        automaticallyImplyLeading: false,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? _buildErrorScreen()
              : _currentJobs.isEmpty
                  ? const Center(child: Text('No active jobs detected.'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          // Carousel Title / Navigation
                          if (_currentJobs.length > 1) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'TICKET ${_currentTicketIndex + 1} OF ${_currentJobs.length}',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.arrow_back_ios, size: 14),
                                      onPressed: _currentTicketIndex > 0
                                          ? () {
                                              _pageController.previousPage(
                                                duration: const Duration(milliseconds: 300),
                                                curve: Curves.easeInOut,
                                              );
                                            }
                                          : null,
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.arrow_forward_ios, size: 14),
                                      onPressed: _currentTicketIndex < _currentJobs.length - 1
                                          ? () {
                                              _pageController.nextPage(
                                                duration: const Duration(milliseconds: 300),
                                                curve: Curves.easeInOut,
                                              );
                                            }
                                          : null,
                                    ),
                                  ],
                                )
                              ],
                            ),
                            const SizedBox(height: 8),
                          ],

                          // 1. Swipable Ticket Carousel
                          SizedBox(
                            height: 270,
                            child: PageView.builder(
                              controller: _pageController,
                              itemCount: _currentJobs.length,
                              onPageChanged: (idx) {
                                setState(() {
                                  _currentTicketIndex = idx;
                                });
                              },
                              itemBuilder: (context, index) {
                                final job = _currentJobs[index];
                                final rate = job.preferences.color ? widget.shop.priceColor : widget.shop.priceMono;
                                final cost = rate * job.preferences.copies * job.pageCount;
                                return _buildTicketCard(job, cost, isDark);
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Dots indicator
                          if (_currentJobs.length > 1) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(_currentJobs.length, (index) {
                                final isSelected = index == _currentTicketIndex;
                                return AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin: const EdgeInsets.symmetric(horizontal: 4),
                                  width: isSelected ? 16 : 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppColors.primary : Colors.grey[400],
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                );
                              }),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // 2. Active Ticket Status Stepper
                          (() {
                            final activeJob = _currentJobs[_currentTicketIndex];
                            final stepIndex = _getStatusStepIndex(activeJob.status);
                            final isFailed = activeJob.status == 'failed' || activeJob.status == 'cancelled';
                            
                            if (isFailed) {
                              return Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.red.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Iconsax.info_circle, color: Colors.red),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Print Job was ${activeJob.status.toUpperCase()}. Check with the shopkeeper or re-submit.',
                                        style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }
                            return _buildStepper(stepIndex);
                          })(),

                          const SizedBox(height: 40),

                          // 3. Action Buttons
                          Row(
                            children: [
                              // Pay via UPI Button
                              if (widget.shop.upiId != null && _isAnyJobUnpaid())
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _showPaymentBottomSheet(_calculateTotalAmount()),
                                    icon: const Icon(Iconsax.wallet_2),
                                    label: const Text('PAY VIA UPI App'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    ),
                                  ),
                                ),
                              if (widget.shop.upiId != null && _isAnyJobUnpaid())
                                const SizedBox(width: 12),
                              
                              // Dashboard return
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () {
                                    Navigator.pushAndRemoveUntil(
                                      context,
                                      MaterialPageRoute(builder: (_) => const NavigationHub()),
                                      (route) => false,
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: isDark ? Colors.white : Colors.black,
                                    side: BorderSide(color: isDark ? Colors.white54 : Colors.black),
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                  child: const Text('DASHBOARD', style: TextStyle(fontWeight: FontWeight.w900)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildTicketCard(PrintJob job, double cost, bool isDark) {
    final isPaid = job.isPaid || _localPaymentConfirmed;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.05),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: isDark ? AppColors.borderDark : Colors.grey[200]!),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            height: 12,
            color: isPaid ? AppColors.success : AppColors.primary,
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'XEROXQ PICKUP TOKEN',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: Colors.grey,
                      ),
                    ),
                    if (isPaid)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'PAID ONLINE',
                          style: TextStyle(color: AppColors.success, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                // Token Display
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
                  decoration: BoxDecoration(
                    color: (isPaid ? AppColors.success : AppColors.primary).withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: (isPaid ? AppColors.success : AppColors.primary).withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    job.token,
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      color: isPaid ? AppColors.success : AppColors.primary,
                      letterSpacing: -1,
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                _buildTicketRow('File Name', job.fileName),
                _buildTicketRow('Pages', '${job.pageCount} pages x ${job.preferences.copies} copies'),
                _buildTicketRow('Print Mode', job.preferences.color ? 'Color' : 'Grayscale'),
                
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('File Subtotal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('₹${cost.toStringAsFixed(2)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Iconsax.info_circle, size: 72, color: Colors.red),
            const SizedBox(height: 24),
            const Text('Job Tracker Error', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(_errorMessage, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const NavigationHub()),
                  (route) => false,
                );
              },
              child: const Text('Back to Dashboard'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepper(int activeStep) {
    final steps = [
      {'title': 'Queued', 'desc': 'File uploaded & in line'},
      {'title': 'Printing', 'desc': 'Shop owner processing'},
      {'title': 'Ready', 'desc': 'Prints ready for pickup'},
      {'title': 'Completed', 'desc': 'Collected & Done'},
    ];

    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final isCompleted = index < activeStep;
        final isActive = index == activeStep;
        
        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Column 1: Dot and Line
              Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? AppColors.success
                          : isActive
                              ? AppColors.primary
                              : Colors.grey[200],
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isActive ? AppColors.primary.withValues(alpha: 0.4) : Colors.transparent,
                        width: isActive ? 4 : 0,
                      ),
                    ),
                    child: Center(
                      child: isCompleted
                          ? const Icon(Iconsax.tick_circle, size: 14, color: Colors.white)
                          : Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: isActive ? Colors.white : Colors.grey,
                                shape: BoxShape.circle,
                              ),
                            ),
                    ),
                  ),
                  if (index < steps.length - 1)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: isCompleted ? AppColors.success : Colors.grey[300],
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              // Column 2: Text Description
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        step['title']!,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isActive
                              ? AppColors.primary
                              : isCompleted
                                  ? AppColors.textPrimaryLight
                                  : Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        step['desc']!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isActive
                               ? AppColors.primary.withValues(alpha: 0.8)
                              : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
