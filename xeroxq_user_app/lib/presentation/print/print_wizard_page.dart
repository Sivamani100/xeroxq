import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb, Uint8List, debugPrint;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:open_file/open_file.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/shop_repository.dart';
import '../../data/vault_repository.dart';
import '../../data/job_repository.dart';
import 'job_tracking_page.dart';

const Color _emeraldGreen = Color(0xFF10B981);

class PrintWizardPage extends StatefulWidget {
  final File? initialFile;
  final Shop? initialShop;
  final Uint8List? initialBytes;
  final String? initialFileName;

  const PrintWizardPage({
    super.key,
    this.initialFile,
    this.initialShop,
    this.initialBytes,
    this.initialFileName,
  });

  @override
  State<PrintWizardPage> createState() => _PrintWizardPageState();
}

class _PrintWizardPageState extends State<PrintWizardPage> {
  int _currentStep = 0;
  
  // Selection States
  final List<PrintFile> _selectedFiles = [];
  Shop? _selectedShop;
  
  // Contact Info
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  // Search Shops
  List<Shop> _allShops = [];
  List<Shop> _filteredShops = [];

  // Document Vault list
  List<VaultDocument> _vaultDocs = [];
  bool _loadingDocs = true;

  bool _isUploading = false;
  int _uploadingIndex = 0;
  double _uploadProgress = 0.0;

  // Expansion state of file panels
  final Map<String, bool> _expandedFiles = {};

  @override
  void initState() {
    super.initState();
    _selectedShop = widget.initialShop;
    
    // Initialize with passed documents
    if (widget.initialFile != null) {
      _addFileToList(widget.initialFile!).then((_) {
        setState(() {
          // If we had a preselected shop, advance to summary, otherwise shop select
          _currentStep = _selectedShop != null ? 2 : 1;
        });
      });
    } else if (widget.initialBytes != null && widget.initialFileName != null) {
      _addBytesToList(widget.initialBytes!, widget.initialFileName!);
      // If we had a preselected shop, advance to summary, otherwise shop select
      _currentStep = _selectedShop != null ? 2 : 1;
    }
    
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    // Load shop list
    final shopRepo = context.read<ShopRepository>();
    final shops = await shopRepo.fetchShops();
    
    // Load vault docs
    if (!mounted) return;
    final vaultRepo = context.read<VaultRepository>();
    final docs = await vaultRepo.getDocuments();

    // Load saved contact info
    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('xeroxq_user_name') ?? '';
    final savedPhone = prefs.getString('xeroxq_user_phone') ?? '';

    setState(() {
      _allShops = shops;
      _filteredShops = shops;
      _vaultDocs = docs;
      _loadingDocs = false;
      _nameController.text = savedName;
      _phoneController.text = savedPhone;
    });
  }

  int _extractPdfPageCount(Uint8List bytes) {
    try {
      final pdfString = String.fromCharCodes(bytes);
      
      // Look for the Count key in the Pages dictionary
      final pagesRegex = RegExp(r'/Type\s*/Pages.*?/Count\s+(\d+)', dotAll: true);
      final match = pagesRegex.firstMatch(pdfString);
      if (match != null) {
        final count = int.tryParse(match.group(1) ?? '1') ?? 1;
        if (count > 0) return count;
      }
      
      // Fallback: search all /Count entries and find the maximum one
      final countRegex = RegExp(r'/Count\s+(\d+)');
      final matches = countRegex.allMatches(pdfString);
      int maxCount = 1;
      for (final m in matches) {
        final val = int.tryParse(m.group(1) ?? '1') ?? 1;
        if (val > maxCount) {
          maxCount = val;
        }
      }
      return maxCount;
    } catch (e) {
      debugPrint('Error parsing PDF page count: $e');
      return 1;
    }
  }

  Future<void> _addFileToList(File file) async {
    final name = file.path.split('/').last.split('\\').last;
    final size = await file.length();
    int pages = 1;
    if (name.toLowerCase().endsWith('.pdf')) {
      try {
        final bytes = await file.readAsBytes();
        pages = _extractPdfPageCount(bytes);
      } catch (e) {
        debugPrint('Failed to read PDF bytes for page count: $e');
      }
    }
    setState(() {
      final id = '${DateTime.now().microsecondsSinceEpoch}_$name';
      _selectedFiles.add(PrintFile(
        id: id,
        name: name,
        file: file,
        sizeBytes: size,
        totalPages: pages,
      ));
      _expandedFiles[id] = true;
    });
  }

  void _addBytesToList(Uint8List bytes, String name) {
    int pages = 1;
    if (name.toLowerCase().endsWith('.pdf')) {
      pages = _extractPdfPageCount(bytes);
    }
    setState(() {
      final id = '${DateTime.now().microsecondsSinceEpoch}_$name';
      _selectedFiles.add(PrintFile(
        id: id,
        name: name,
        bytes: bytes,
        sizeBytes: bytes.length,
        totalPages: pages,
      ));
      _expandedFiles[id] = true;
    });
  }

  Future<void> _pickFileFromDevice() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      withData: true, // required to get bytes on web
    );
    if (result != null) {
      for (final pickedFile in result.files) {
        if (kIsWeb) {
          if (pickedFile.bytes != null) {
            _addBytesToList(pickedFile.bytes!, pickedFile.name);
          }
        } else {
          if (pickedFile.path != null) {
            await _addFileToList(File(pickedFile.path!));
          }
        }
      }
    }
  }

  Future<void> _pickMultipleImages() async {
    final ImagePicker picker = ImagePicker();
    try {
      final List<XFile> images = await picker.pickMultiImage(imageQuality: 90);
      if (images.isNotEmpty) {
        for (final img in images) {
          final bytes = await img.readAsBytes();
          if (kIsWeb) {
            _addBytesToList(bytes, img.name);
          } else {
            await _addFileToList(File(img.path));
          }
        }
      }
    } catch (e) {
      debugPrint('Error picking images: $e');
    }
  }

  void _selectVaultFile(VaultDocument doc) async {
    final vaultRepo = context.read<VaultRepository>();
    final bytes = await vaultRepo.getDocumentBytes(doc);
    if (kIsWeb) {
      _addBytesToList(bytes, doc.name);
    } else {
      await _addFileToList(File(doc.localPath));
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${doc.name} added to print queue.'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _nextStep() {
    if (_currentStep < 2) {
      setState(() {
        _currentStep++;
      });
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    }
  }

  double _calculateTotalCost() {
    if (_selectedShop == null || _selectedFiles.isEmpty) return 0.0;
    double total = 0.0;
    for (final file in _selectedFiles) {
      total += file.calculateCost(_selectedShop!);
    }
    return total;
  }

  Future<void> _submitPrintJob() async {
    if (_selectedFiles.isEmpty || _selectedShop == null) return;
    if (_phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide your phone number for pick up identification.')),
      );
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadingIndex = 0;
      _uploadProgress = 0.0;
    });

    // Save contact info locally
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('xeroxq_user_name', _nameController.text.trim());
    await prefs.setString('xeroxq_user_phone', _phoneController.text.trim());

    try {
      if (!mounted) return;
      final jobRepo = context.read<JobRepository>();

      final jobs = await jobRepo.submitMultipleJobs(
        printFiles: _selectedFiles,
        customerName: _nameController.text.trim(),
        customerPhone: _phoneController.text.trim(),
        shopId: _selectedShop!.id,
        shopName: _selectedShop!.name,
        onProgress: (index, progress) {
          setState(() {
            _uploadingIndex = index;
            _uploadProgress = progress;
          });
        },
      );

      setState(() => _isUploading = false);

      if (mounted) {
        // Navigate to Job tracking screen, passing the list of jobs!
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => JobTrackingPage(
              jobIds: jobs.map((j) => j.id).toList(),
              shop: _selectedShop!,
            ),
          ),
        );
      }
    } catch (e) {
      setState(() => _isUploading = false);
      debugPrint('Job submission error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit print jobs: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('PRINT WIZARD'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isUploading
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(color: AppColors.primary),
                    const SizedBox(height: 24),
                    Text(
                      'Uploading File ${_uploadingIndex + 1} of ${_selectedFiles.length}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _selectedFiles[_uploadingIndex].name,
                      style: const TextStyle(color: Colors.grey),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 24),
                    Container(
                      height: 12,
                      width: double.infinity,
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.grey[900] : Colors.grey[200],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: LinearProgressIndicator(
                        value: _uploadProgress,
                        color: AppColors.primary,
                        backgroundColor: Colors.transparent,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${(_uploadProgress * 100).toInt()}% completed',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            )
          : Column(
              children: [
                // Top Step Progress Indicator
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  color: isDark ? AppColors.cardDark : Colors.grey[100],
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildStepTab(0, 'FILES & CONFIG', Icons.insert_drive_file),
                      _buildStepDivider(),
                      _buildStepTab(1, 'SHOP', Icons.store),
                      _buildStepDivider(),
                      _buildStepTab(2, 'SUBMIT', Icons.receipt),
                    ],
                  ),
                ),
                
                // Active Step Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: _buildStepContent(),
                  ),
                ),

                // Bottom Action buttons
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Row(
                    children: [
                      if (_currentStep > 0)
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _prevStep,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: isDark ? Colors.white : Colors.black,
                              side: BorderSide(color: isDark ? Colors.white54 : Colors.black),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('BACK', style: TextStyle(fontWeight: FontWeight.w900)),
                          ),
                        ),
                      if (_currentStep > 0) const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _currentStep == 0
                              ? (_selectedFiles.isEmpty ? null : _nextStep)
                              : _currentStep == 1 && _selectedShop == null
                                  ? null // Must pick a shop
                                  : _currentStep == 2
                                      ? _submitPrintJob
                                      : _nextStep,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Text(
                            _currentStep == 2 ? 'CONFIRM & PRINT' : 'CONTINUE',
                            style: const TextStyle(fontWeight: FontWeight.w900),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildStepTab(int index, String title, IconData icon) {
    final isActive = _currentStep == index;
    final isDone = _currentStep > index;
    
    return Row(
      children: [
        Icon(
          icon,
          color: isActive 
              ? AppColors.primary 
              : isDone 
                  ? AppColors.success 
                  : Colors.grey,
          size: 20,
        ),
        const SizedBox(width: 6),
        Text(
          title,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: isActive 
                ? AppColors.primary 
                : isDone 
                    ? AppColors.success 
                    : Colors.grey,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildStepDivider() {
    return Container(
      width: 24,
      height: 1,
      color: Colors.grey[300],
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildFileSelectionStep();
      case 1:
        return _buildShopSelectionStep();
      case 2:
        return _buildSummaryStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildFileSelectionStep() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_selectedFiles.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select File to Print',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
          ),
          const SizedBox(height: 8),
          const Text(
            'Choose a document from your secure vault or import from device storage.',
            style: TextStyle(color: AppColors.textSecondaryLight),
          ),
          const SizedBox(height: 24),
          
          // Import Button
          GestureDetector(
            onTap: _pickFileFromDevice,
            child: Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), style: BorderStyle.values[1]),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.upload_file_outlined, size: 36, color: AppColors.primary),
                  SizedBox(height: 8),
                  Text(
                    'Import from Device Storage',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'PDF, Word, or Images',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          // Multiple Images Button
          GestureDetector(
            onTap: _pickMultipleImages,
            child: Container(
              height: 100,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.withValues(alpha: 0.2), style: BorderStyle.values[1]),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.photo_library_outlined, size: 30, color: AppColors.primary),
                  SizedBox(height: 8),
                  Text(
                    'Add Multiple Images from Gallery',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          const Text(
            'FROM SECURE VAULT',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.0),
          ),
          const SizedBox(height: 16),
          _loadingDocs
              ? const Center(child: CircularProgressIndicator())
              : _vaultDocs.isEmpty
                  ? Container(
                      padding: const EdgeInsets.all(24),
                      alignment: Alignment.center,
                      child: const Text('Vault is empty. Go back and add documents.', style: TextStyle(color: Colors.grey)),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _vaultDocs.length,
                      itemBuilder: (context, index) {
                        final doc = _vaultDocs[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(color: Colors.grey[200]!, width: 1),
                          ),
                          child: ListTile(
                            leading: const Icon(Icons.insert_drive_file, color: AppColors.primary),
                            title: Text(doc.name, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1),
                            subtitle: Text('${doc.category} • ${(doc.sizeBytes/1024).toStringAsFixed(1)} KB'),
                            onTap: () => _selectVaultFile(doc),
                          ),
                        );
                      },
                    ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Selected Print Queue',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
            ),
            Text(
              '${_selectedFiles.length} file(s)',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // List of files in the queue
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _selectedFiles.length,
          itemBuilder: (context, index) {
            final printFile = _selectedFiles[index];
            return _buildPrintFileCard(printFile, index, isDark);
          },
        ),
        const SizedBox(height: 20),

        // Actions to add more
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickFileFromDevice,
                icon: const Icon(Icons.add_to_photos_outlined, size: 18, color: AppColors.primary),
                label: const Text('Add Files', style: TextStyle(color: AppColors.primary)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickMultipleImages,
                icon: const Icon(Icons.image_outlined, size: 18, color: AppColors.primary),
                label: const Text('Add Images', style: TextStyle(color: AppColors.primary)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 32),
        const Text(
          'ADD FROM SECURE VAULT',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.0),
        ),
        const SizedBox(height: 12),
        _loadingDocs
            ? const Center(child: CircularProgressIndicator())
            : _vaultDocs.isEmpty
                ? const SizedBox.shrink()
                : SizedBox(
                    height: 80,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _vaultDocs.length,
                      itemBuilder: (context, index) {
                        final doc = _vaultDocs[index];
                        return Container(
                          width: 150,
                          margin: const EdgeInsets.only(right: 12),
                          child: InkWell(
                            onTap: () => _selectVaultFile(doc),
                            borderRadius: BorderRadius.circular(16),
                            child: Ink(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.cardDark : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: isDark ? AppColors.borderDark : Colors.grey[200]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.insert_drive_file, color: AppColors.primary, size: 16),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          doc.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${(doc.sizeBytes/1024).toStringAsFixed(1)} KB',
                                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
      ],
    );
  }

  Widget _buildPrintFileCard(PrintFile printFile, int fileIndex, bool isDark) {
    final isExpanded = _expandedFiles[printFile.id] ?? true;
    final isPdf = printFile.name.toLowerCase().endsWith('.pdf');
    final isImage = ['jpg', 'jpeg', 'png'].contains(printFile.extension);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: isDark ? AppColors.borderDark : Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          ListTile(
            leading: CircleAvatar(
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              child: Icon(
                isPdf ? Icons.picture_as_pdf : isImage ? Icons.image : Icons.insert_drive_file,
                color: AppColors.primary,
              ),
            ),
            title: Text(
              printFile.name,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Text(
              '${printFile.formattedSize} • ${printFile.totalPages} page(s)',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: Icon(isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 20),
                  onPressed: () {
                    setState(() {
                      _expandedFiles[printFile.id] = !isExpanded;
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                  onPressed: () {
                    setState(() {
                      _selectedFiles.removeAt(fileIndex);
                    });
                  },
                ),
              ],
            ),
          ),

          if (isExpanded) ...[
            const Divider(height: 1),
            
            // Preview & Grayscale Filter Area
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Preview box
                  GestureDetector(
                    onTap: () {
                      if (kIsWeb) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Document viewing not supported on web preview')),
                        );
                      } else {
                        if (printFile.file != null) {
                          OpenFile.open(printFile.file!.path);
                        }
                      }
                    },
                    child: Container(
                      width: 85,
                      height: 85,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.backgroundDark : Colors.grey[100],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? AppColors.borderDark : Colors.grey[300]!),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          if (isImage)
                            ColorFiltered(
                              colorFilter: printFile.color
                                  ? const ColorFilter.mode(Colors.transparent, BlendMode.dst)
                                  : const ColorFilter.matrix([
                                      0.2126, 0.7152, 0.0722, 0, 0,
                                      0.2126, 0.7152, 0.0722, 0, 0,
                                      0.2126, 0.7152, 0.0722, 0, 0,
                                      0,      0,      0,      1, 0,
                                    ]),
                              child: printFile.bytes != null
                                  ? Image.memory(printFile.bytes!, fit: BoxFit.cover)
                                  : Image.file(printFile.file!, fit: BoxFit.cover),
                            )
                          else
                            Icon(Icons.picture_as_pdf, color: AppColors.primary.withValues(alpha: 0.5), size: 36),
                          
                          // Quick instruction overlay
                          Positioned(
                            bottom: 0,
                            left: 0,
                            right: 0,
                            child: Container(
                              color: Colors.black.withValues(alpha: 0.5),
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: const Text(
                                'VIEW',
                                style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  // Simple config toggles
                  Expanded(
                    child: Column(
                      children: [
                        // Color Toggle
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Color Print', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            Switch(
                              value: printFile.color,
                              activeThumbColor: AppColors.primary,
                              onChanged: (val) {
                                setState(() {
                                  printFile.color = val;
                                });
                              },
                            ),
                          ],
                        ),
                        // Double Sided Toggle
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Double Sided', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            Switch(
                              value: printFile.doubleSided,
                              activeThumbColor: AppColors.primary,
                              onChanged: (val) {
                                setState(() {
                                  printFile.doubleSided = val;
                                });
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Copies Incrementer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Copies', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          if (printFile.copies > 1) {
                            setState(() => printFile.copies--);
                          }
                        },
                        icon: const Icon(Icons.remove_circle_outline, size: 22),
                      ),
                      Text('${printFile.copies}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      IconButton(
                        onPressed: () => setState(() => printFile.copies++),
                        icon: const Icon(Icons.add_circle_outline, size: 22),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Page Selector Segment (All, Custom, Range)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Pages to Print', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 10),
                  // Segment tabs
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? Colors.grey[900] : Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: [
                        _buildPageSelectionTab(printFile, 'all', 'All', isDark),
                        if (isPdf) ...[
                          _buildPageSelectionTab(printFile, 'custom', 'Select Pages', isDark),
                          _buildPageSelectionTab(printFile, 'range', 'Range', isDark),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Selection Views
                  if (printFile.pageSelectionType == 'all')
                    Text(
                      'Printing all ${printFile.totalPages} pages.',
                      style: const TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
                    )
                  else if (printFile.pageSelectionType == 'custom') ...[
                    const Text('Tap pages to include:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: List.generate(printFile.totalPages, (pIdx) {
                        final pageNum = pIdx + 1;
                        final isSelected = printFile.selectedPages.contains(pageNum);
                        return ChoiceChip(
                          label: Text('$pageNum'),
                          selected: isSelected,
                          selectedColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : null,
                          ),
                          onSelected: (val) {
                            setState(() {
                              if (val) {
                                printFile.selectedPages.add(pageNum);
                              } else {
                                if (printFile.selectedPages.length > 1) {
                                  printFile.selectedPages.remove(pageNum);
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('At least one page must be selected.')),
                                  );
                                }
                              }
                            });
                          },
                        );
                      }),
                    ),
                  ] else if (printFile.pageSelectionType == 'range') ...[
                    const Text('Enter print range (e.g. 1-3, 5):', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 8),
                    TextField(
                      onChanged: (val) {
                        setState(() {
                          printFile.rangeText = val;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'e.g. 1-5, 8, 10-12',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Cost Breakdown Footer
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? Colors.black.withValues(alpha: 0.2) : Colors.grey[50],
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('File Total Cost', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(
                    _selectedShop != null
                        ? '₹${printFile.calculateCost(_selectedShop!).toStringAsFixed(2)}'
                        : 'Select shop to estimate cost',
                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 15),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPageSelectionTab(PrintFile printFile, String type, String label, bool isDark) {
    final isSelected = printFile.pageSelectionType == type;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            printFile.pageSelectionType = type;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? Colors.black : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    )
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSelected ? AppColors.primary : Colors.grey,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShopSelectionStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Print Shop',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
        ),
        const SizedBox(height: 24),

        TextField(
          onChanged: (val) {
            setState(() {
              _filteredShops = _allShops.where((s) => s.name.toLowerCase().contains(val.toLowerCase())).toList();
            });
          },
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.search),
            hintText: 'Search shop by name...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            isDense: true,
          ),
        ),
        const SizedBox(height: 24),

        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredShops.length,
          itemBuilder: (context, index) {
            final shop = _filteredShops[index];
            final isSelected = _selectedShop?.id == shop.id;
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: isSelected ? AppColors.primary.withValues(alpha: 0.05) : null,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected ? AppColors.primary : Colors.grey[200]!,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: shop.isOpen ? _emeraldGreen.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.store, color: shop.isOpen ? _emeraldGreen : Colors.red),
                ),
                title: Text(shop.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                  'Mono: ₹${shop.priceMono.toStringAsFixed(1)} | Color: ₹${shop.priceColor.toStringAsFixed(1)}',
                ),
                trailing: shop.isOpen 
                    ? const Icon(Icons.check_circle_outline, color: _emeraldGreen)
                    : const Text('CLOSED', style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.w900)),
                onTap: () {
                  if (shop.isOpen) {
                    setState(() {
                      _selectedShop = shop;
                    });
                    _nextStep();
                  }
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildSummaryStep() {
    final double cost = _calculateTotalCost();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Confirm & Submit Job',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
        ),
        const SizedBox(height: 24),

        // Summary details card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardDark : Colors.grey[50],
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: isDark ? AppColors.borderDark : Colors.grey[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('PRINT QUEUE SUMMARY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
              const SizedBox(height: 16),
              
              ...List.generate(_selectedFiles.length, (index) {
                final file = _selectedFiles[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            file.name.toLowerCase().endsWith('.pdf') ? Icons.picture_as_pdf : Icons.image,
                            size: 14,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              file.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _selectedShop != null ? '₹${file.calculateCost(_selectedShop!).toStringAsFixed(2)}' : '',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 22.0, top: 2.0),
                        child: Text(
                          '${file.color ? "Color" : "Grayscale"} • ${file.doubleSided ? "Double-sided" : "Single-sided"} • ${file.copies} copies • Pages: ${file.getFormattedRange()} (Total ${file.pagesToPrintCount} pages)',
                          style: const TextStyle(color: Colors.grey, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const Divider(height: 24),
              _buildSummaryRow(Icons.store, 'Destination Shop', _selectedShop?.name ?? ''),
              
              const Divider(height: 32),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Estimated Cost', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(
                    '₹${cost.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primary),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),

        const Text(
          'CONTACT INFO FOR PICKUP',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.0),
        ),
        const SizedBox(height: 16),

        // Contact Name Input
        TextField(
          controller: _nameController,
          decoration: InputDecoration(
            labelText: 'Your Name',
            hintText: 'e.g. John Doe',
            prefixIcon: const Icon(Icons.person_outline),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        const SizedBox(height: 16),

        // Contact Phone Input
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: 'Phone Number',
            hintText: 'e.g. 9849497911',
            prefixIcon: const Icon(Icons.phone_android),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(color: AppColors.textSecondaryLight, fontSize: 13)),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
