import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:local_auth/local_auth.dart';
import 'package:open_file/open_file.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/vault_repository.dart';
import '../print/print_wizard_page.dart';
import 'scan_page.dart';

class VaultPage extends StatefulWidget {
  const VaultPage({super.key});

  @override
  State<VaultPage> createState() => _VaultPageState();
}

class _VaultPageState extends State<VaultPage> with SingleTickerProviderStateMixin {
  final LocalAuthentication _auth = LocalAuthentication();
  bool _isAuthenticated = false;
  bool _lockEnabled = false;
  bool _loading = true;
  List<VaultDocument> _allDocs = [];
  List<VaultDocument> _filteredDocs = [];
  String _searchQuery = '';
  String _selectedCategory = 'All';
  bool _showFavouritesOnly = false;
  late TabController _tabController;

  static const List<String> _categories = [
    'All', 'IDs', 'Academic', 'Work', 'Receipts', 'Others'
  ];

  // Max displayed storage (500 MB)
  static const int _maxBytes = 500 * 1024 * 1024;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _checkVaultSecurity();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _checkVaultSecurity() async {
    if (!mounted) return;
    final vaultRepo = context.read<VaultRepository>();
    final lockEnabled = await vaultRepo.isLockEnabled();
    setState(() {
      _lockEnabled = lockEnabled;
      _isAuthenticated = !lockEnabled;
    });
    if (lockEnabled) {
      _authenticate();
    } else {
      _loadDocuments();
    }
  }

  Future<void> _authenticate() async {
    try {
      final bool ok = await _auth.authenticate(
        localizedReason: 'Authenticate to access your Secure Document Vault',
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
      if (ok) {
        setState(() => _isAuthenticated = true);
        _loadDocuments();
      } else {
        setState(() => _loading = false);
      }
    } catch (e) {
      debugPrint('Biometric error: $e');
      setState(() => _loading = false);
    }
  }

  Future<void> _loadDocuments() async {
    setState(() => _loading = true);
    if (!mounted) return;
    final vaultRepo = context.read<VaultRepository>();
    final docs = await vaultRepo.getDocuments();
    if (mounted) {
      setState(() {
        _allDocs = docs;
        _applyFilters();
        _loading = false;
      });
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredDocs = _allDocs.where((doc) {
        final matchesSearch = doc.name.toLowerCase().contains(_searchQuery.toLowerCase());
        final matchesCategory = _selectedCategory == 'All' || doc.category == _selectedCategory;
        final matchesFav = !_showFavouritesOnly || doc.isFavourite;
        return matchesSearch && matchesCategory && matchesFav;
      }).toList();
    });
  }

  Future<void> _pickAndAddFile() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'],
      withData: true, // required to get bytes on web
    );
    if (result == null) return;
    
    final pickedFile = result.files.single;
    if (kIsWeb) {
      if (pickedFile.bytes == null) return;
      if (!mounted) return;
      await context.read<VaultRepository>().addFileToVault(
            sourceBytes: pickedFile.bytes,
            name: pickedFile.name,
            category: _selectedCategory == 'All' ? 'Others' : _selectedCategory,
          );
    } else {
      if (pickedFile.path == null) return;
      if (!mounted) return;
      await context.read<VaultRepository>().addFileToVault(
            sourceFile: File(pickedFile.path!),
            name: pickedFile.name,
            category: _selectedCategory == 'All' ? 'Others' : _selectedCategory,
          );
    }
    _loadDocuments();
  }

  Future<void> _toggleFavourite(VaultDocument doc) async {
    if (!mounted) return;
    await context.read<VaultRepository>().toggleFavourite(doc.id);
    _loadDocuments();
  }

  Future<void> _deleteDocument(VaultDocument doc) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Document', style: TextStyle(fontWeight: FontWeight.w900)),
        content: Text('Remove "${doc.name}" from your vault? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;
    await context.read<VaultRepository>().deleteDocument(doc.id);
    _loadDocuments();
  }

  Future<void> _renameDocument(VaultDocument doc) async {
    final ctrl = TextEditingController(text: doc.name);
    final newName = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Rename Document', style: TextStyle(fontWeight: FontWeight.w900)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Document name',
            filled: true,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(context, ctrl.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (newName == null || newName.isEmpty) return;
    if (!mounted) return;
    await context.read<VaultRepository>().renameDocument(doc.id, newName);
    _loadDocuments();
  }

  void _shareDocument(VaultDocument doc) {
    if (kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sharing not supported on web preview')),
      );
      return;
    }
    Share.shareXFiles([XFile(doc.localPath)], text: 'Document from XeroxQ Vault');
  }

  void _sendToPrint(VaultDocument doc) async {
    context.read<VaultRepository>().markRecentlyAccessed(doc.id);
    if (kIsWeb) {
      final bytes = await context.read<VaultRepository>().getDocumentBytes(doc);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PrintWizardPage(
            initialFileName: doc.name,
            initialBytes: bytes,
          ),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PrintWizardPage(
            initialFile: File(doc.localPath),
          ),
        ),
      );
    }
  }

  void _openDoc(VaultDocument doc) async {
    context.read<VaultRepository>().markRecentlyAccessed(doc.id);
    if (kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Direct file viewing not supported on web preview')),
      );
    } else {
      OpenFile.open(doc.localPath);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vaultRepo = context.read<VaultRepository>();
    final usedBytes = vaultRepo.totalUsedBytes();
    final storagePercent = (usedBytes / _maxBytes).clamp(0.0, 1.0);
    final usedFormatted = _bytesToString(usedBytes);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F7),
      body: SafeArea(
        child: !_isAuthenticated
            ? _buildLockedState()
            : Column(
                children: [
                  // Header
                  _buildHeader(usedBytes, usedFormatted, storagePercent),

                  // Category filter chips
                  _buildCategoryChips(),

                  // Document list / empty state
                  Expanded(
                    child: _loading
                        ? const Center(child: CircularProgressIndicator())
                        : _filteredDocs.isEmpty
                            ? _buildEmptyState()
                            : RefreshIndicator(
                                onRefresh: _loadDocuments,
                                child: ListView.builder(
                                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                                  itemCount: _filteredDocs.length,
                                  itemBuilder: (_, i) => _DocCard(
                                    doc: _filteredDocs[i],
                                    onFavourite: () => _toggleFavourite(_filteredDocs[i]),
                                    onDelete: () => _deleteDocument(_filteredDocs[i]),
                                    onRename: () => _renameDocument(_filteredDocs[i]),
                                    onShare: () => _shareDocument(_filteredDocs[i]),
                                    onPrint: () => _sendToPrint(_filteredDocs[i]),
                                    onOpen: () => _openDoc(_filteredDocs[i]),
                                  ),
                                ),
                              ),
                  ),
                ],
              ),
      ),

      floatingActionButton: _isAuthenticated
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Scan FAB
                FloatingActionButton(
                  heroTag: 'scan',
                  mini: true,
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  onPressed: () async {
                    await Navigator.push(
                        context, MaterialPageRoute(builder: (_) => const ScanPage()));
                    _loadDocuments();
                  },
                  child: const Icon(Iconsax.scan, size: 18),
                ),
                const SizedBox(height: 10),
                // Add file FAB
                FloatingActionButton.extended(
                  heroTag: 'add',
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  onPressed: _pickAndAddFile,
                  icon: const Icon(Iconsax.document_upload),
                  label: const Text('Add File', style: TextStyle(fontWeight: FontWeight.w700)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ],
            )
          : null,
    );
  }

  Widget _buildHeader(int usedBytes, String usedFormatted, double storagePercent) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.folder_open, color: AppColors.primary, size: 22),
              const SizedBox(width: 10),
              const Text('My Vault', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              const Spacer(),
              // Favourites toggle
              GestureDetector(
                onTap: () {
                  setState(() => _showFavouritesOnly = !_showFavouritesOnly);
                  _applyFilters();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: _showFavouritesOnly
                        ? AppColors.warning.withValues(alpha: 0.15)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _showFavouritesOnly
                          ? AppColors.warning
                          : AppColors.borderLight,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _showFavouritesOnly ? Iconsax.star1 : Iconsax.star,
                        color: AppColors.warning,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Starred',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _showFavouritesOnly ? AppColors.warning : AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Lock toggle
              GestureDetector(
                onTap: _toggleLock,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.borderLight),
                  ),
                  child: Icon(
                    _lockEnabled ? Iconsax.lock : Iconsax.unlock,
                    size: 18,
                    color: _lockEnabled ? AppColors.primary : AppColors.textSecondaryLight,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Search bar
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: TextField(
              onChanged: (v) {
                _searchQuery = v;
                _applyFilters();
              },
              decoration: const InputDecoration(
                hintText: 'Search documents…',
                prefixIcon: Icon(Iconsax.search_normal, size: 18),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),

          const SizedBox(height: 10),

          // Storage bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              children: [
                const Icon(Iconsax.cpu, size: 16, color: AppColors.textSecondaryLight),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '$usedFormatted used of 500 MB',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '${_allDocs.length} files',
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.textSecondaryLight),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      LinearPercentIndicator(
                        padding: EdgeInsets.zero,
                        percent: storagePercent,
                        lineHeight: 5,
                        backgroundColor: AppColors.borderLight,
                        progressColor: storagePercent > 0.8
                            ? AppColors.error
                            : AppColors.primary,
                        barRadius: const Radius.circular(8),
                        animation: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _categories.length,
        itemBuilder: (_, i) {
          final cat = _categories[i];
          final selected = _selectedCategory == cat;
          return GestureDetector(
            onTap: () {
              setState(() => _selectedCategory = cat);
              _applyFilters();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.borderLight,
                ),
              ),
              child: Text(
                cat,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : AppColors.textSecondaryLight,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLockedState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: AppGradients.vault,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF667EEA).withValues(alpha: 0.3),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(Iconsax.lock, color: Colors.white, size: 44),
            ),
            const SizedBox(height: 28),
            const Text('Vault Locked', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            const Text(
              'Authenticate to access your secure documents',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondaryLight),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: _authenticate,
              icon: const Icon(Iconsax.lock_1),
              label: const Text('Unlock Vault', style: TextStyle(fontWeight: FontWeight.w900)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Iconsax.folder_open, size: 72, color: AppColors.borderLight),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isNotEmpty || _showFavouritesOnly ? 'No matches found' : 'Vault is empty',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try a different search term'
                  : 'Add PDF, images, or scan documents',
              style: const TextStyle(color: AppColors.textSecondaryLight),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleLock() async {
    if (!mounted) return;
    final vaultRepo = context.read<VaultRepository>();
    await vaultRepo.setLockEnabled(!_lockEnabled);
    setState(() => _lockEnabled = !_lockEnabled);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(_lockEnabled ? 'Vault lock enabled' : 'Vault lock disabled'),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  String _bytesToString(int bytes) {
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)}KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Document card widget
// ──────────────────────────────────────────────────────────────────────────────

class _DocCard extends StatelessWidget {
  final VaultDocument doc;
  final VoidCallback onFavourite;
  final VoidCallback onDelete;
  final VoidCallback onRename;
  final VoidCallback onShare;
  final VoidCallback onPrint;
  final VoidCallback onOpen;

  const _DocCard({
    required this.doc,
    required this.onFavourite,
    required this.onDelete,
    required this.onRename,
    required this.onShare,
    required this.onPrint,
    required this.onOpen,
  });

  IconData get _docIcon {
    switch (doc.extension) {
      case 'pdf': return Iconsax.document_text;
      case 'jpg': case 'jpeg': case 'png': return Iconsax.image;
      case 'doc': case 'docx': return Iconsax.document;
      default: return Iconsax.document;
    }
  }

  Color get _docColor {
    switch (doc.extension) {
      case 'pdf': return AppColors.primary;
      case 'jpg': case 'jpeg': case 'png': return AppColors.info;
      case 'doc': case 'docx': return const Color(0xFF2196F3);
      default: return AppColors.warning;
    }
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.borderLight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onOpen,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: _docColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(_docIcon, color: _docColor, size: 22),
                ),
                const SizedBox(width: 14),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              doc.name,
                              style: const TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w700),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (doc.isFavourite)
                            const Padding(
                              padding: EdgeInsets.only(left: 6),
                              child: Icon(Iconsax.star1, size: 14, color: AppColors.warning),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _Chip(doc.category),
                          const SizedBox(width: 6),
                          _Chip(doc.formattedSize),
                          const SizedBox(width: 6),
                          _Chip(_formatDate(doc.dateAdded)),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // Context menu
                PopupMenuButton<String>(
                  onSelected: (val) {
                    switch (val) {
                      case 'favourite': onFavourite(); break;
                      case 'print': onPrint(); break;
                      case 'share': onShare(); break;
                      case 'rename': onRename(); break;
                      case 'delete': onDelete(); break;
                    }
                  },
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  itemBuilder: (_) => [
                    PopupMenuItem(
                      value: 'favourite',
                      child: _MenuRow(
                        doc.isFavourite ? Iconsax.star_slash : Iconsax.star,
                        doc.isFavourite ? 'Remove Star' : 'Add to Stars',
                        doc.isFavourite ? AppColors.textSecondaryLight : AppColors.warning,
                      ),
                    ),
                    PopupMenuItem(
                      value: 'print',
                      child: _MenuRow(Iconsax.printer, 'Send to Print', AppColors.primary),
                    ),
                    PopupMenuItem(
                      value: 'share',
                      child: _MenuRow(Iconsax.share, 'Share', AppColors.info),
                    ),
                    PopupMenuItem(
                      value: 'rename',
                      child: _MenuRow(Iconsax.edit_2, 'Rename', AppColors.textSecondaryLight),
                    ),
                    const PopupMenuDivider(),
                    PopupMenuItem(
                      value: 'delete',
                      child: _MenuRow(Iconsax.trash, 'Delete', AppColors.error),
                    ),
                  ],
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Iconsax.more_circle,
                        size: 18,
                        color: AppColors.textSecondaryLight),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  const _Chip(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.borderLight,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondaryLight),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _MenuRow(this.icon, this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
