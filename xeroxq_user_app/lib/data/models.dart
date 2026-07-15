import 'dart:io';
import 'package:flutter/foundation.dart' show Uint8List;

class Shop {
  final String id;
  final String name;
  final String slug;
  final String? phone;
  final String? upiId;
  final String? shopLocation;
  final double priceMono;
  final double priceColor;
  final bool isOpen;
  final double? shopLat;
  final double? shopLng;

  Shop({
    required this.id,
    required this.name,
    required this.slug,
    this.phone,
    this.upiId,
    this.shopLocation,
    required this.priceMono,
    required this.priceColor,
    required this.isOpen,
    this.shopLat,
    this.shopLng,
  });

  factory Shop.fromJson(Map<String, dynamic> json) {
    return Shop(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      phone: json['phone'] as String?,
      upiId: json['upi_id'] as String?,
      shopLocation: json['shop_location'] as String?,
      priceMono: (json['price_mono'] as num?)?.toDouble() ?? 1.0,
      priceColor: (json['price_color'] as num?)?.toDouble() ?? 5.0,
      isOpen: json['is_open'] as bool? ?? true,
      shopLat: (json['shop_lat'] as num?)?.toDouble(),
      shopLng: (json['shop_lng'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'phone': phone,
      'upi_id': upiId,
      'shop_location': shopLocation,
      'price_mono': priceMono,
      'price_color': priceColor,
      'is_open': isOpen,
      'shop_lat': shopLat,
      'shop_lng': shopLng,
    };
  }
}

class PrintPreferences {
  final bool color;
  final int copies;
  final bool doubleSided;
  final String? range;

  PrintPreferences({
    this.color = false,
    this.copies = 1,
    this.doubleSided = false,
    this.range,
  });

  factory PrintPreferences.fromJson(Map<String, dynamic> json) {
    return PrintPreferences(
      color: json['color'] as bool? ?? false,
      copies: json['copies'] as int? ?? 1,
      doubleSided: json['doubleSided'] as bool? ?? false,
      range: json['range'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'color': color,
      'copies': copies,
      'doubleSided': doubleSided,
      'range': range,
    };
  }
}

class PrintJob {
  final String id;
  final String token;
  final String customerName;
  final String filePath;
  final String fileName;
  final PrintPreferences preferences;
  final int pageCount;
  final bool isPreorder;
  final bool isPaid;
  final String customerPhone;
  final String shopId;
  final String status;
  final DateTime expiresAt;
  final DateTime? createdAt;

  PrintJob({
    required this.id,
    required this.token,
    required this.customerName,
    required this.filePath,
    required this.fileName,
    required this.preferences,
    required this.pageCount,
    required this.isPreorder,
    required this.isPaid,
    required this.customerPhone,
    required this.shopId,
    required this.status,
    required this.expiresAt,
    this.createdAt,
  });

  factory PrintJob.fromJson(Map<String, dynamic> json) {
    return PrintJob(
      id: json['id'] as String,
      token: json['token'] as String,
      customerName: json['customer_name'] as String? ?? 'Guest',
      filePath: json['file_path'] as String,
      fileName: json['file_name'] as String,
      preferences: json['preferences'] != null
          ? PrintPreferences.fromJson(json['preferences'] as Map<String, dynamic>)
          : PrintPreferences(),
      pageCount: json['page_count'] as int? ?? 1,
      isPreorder: json['is_preorder'] as bool? ?? false,
      isPaid: json['is_paid'] as bool? ?? false,
      customerPhone: json['customer_phone'] as String? ?? '',
      shopId: json['shop_id'] as String,
      status: json['status'] as String? ?? 'pending',
      expiresAt: DateTime.parse(json['expires_at'] as String),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'token': token,
      'customer_name': customerName,
      'file_path': filePath,
      'file_name': fileName,
      'preferences': preferences.toJson(),
      'page_count': pageCount,
      'is_preorder': isPreorder,
      'is_paid': isPaid,
      'customer_phone': customerPhone,
      'shop_id': shopId,
      'status': status,
      'expires_at': expiresAt.toIso8601String(),
    };
  }
}

/// A document stored in the user's local secure vault.
class VaultDocument {
  final String id;
  String name;            // mutable for rename
  final String localPath;
  final int sizeBytes;
  String category;        // mutable for re-categorise
  final DateTime dateAdded;
  List<String> tags;      // mutable
  bool isFavourite;       // NEW — user can star docs
  String? thumbnailPath;  // NEW — cached thumbnail for images

  VaultDocument({
    required this.id,
    required this.name,
    required this.localPath,
    required this.sizeBytes,
    required this.category,
    required this.dateAdded,
    required this.tags,
    this.isFavourite = false,
    this.thumbnailPath,
  });

  factory VaultDocument.fromJson(Map<String, dynamic> json) {
    return VaultDocument(
      id: json['id'] as String,
      name: json['name'] as String,
      localPath: json['localPath'] as String,
      sizeBytes: json['sizeBytes'] as int,
      category: json['category'] as String? ?? 'Others',
      dateAdded: DateTime.parse(json['dateAdded'] as String),
      tags: List<String>.from(json['tags'] as List? ?? []),
      isFavourite: json['isFavourite'] as bool? ?? false,
      thumbnailPath: json['thumbnailPath'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'localPath': localPath,
      'sizeBytes': sizeBytes,
      'category': category,
      'dateAdded': dateAdded.toIso8601String(),
      'tags': tags,
      'isFavourite': isFavourite,
      'thumbnailPath': thumbnailPath,
    };
  }

  /// Human-readable file size string.
  String get formattedSize {
    if (sizeBytes < 1024) return '${sizeBytes}B';
    if (sizeBytes < 1024 * 1024) return '${(sizeBytes / 1024).toStringAsFixed(1)}KB';
    return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  /// File extension (lowercase, without dot).
  String get extension {
    final parts = localPath.split('.');
    return parts.length > 1 ? parts.last.toLowerCase() : 'file';
  }
}

class PrintFile {
  final String id;
  final String name;
  final File? file;          // Null on Web
  final Uint8List? bytes;    // Null on mobile if using file path
  final int sizeBytes;
  final int totalPages;      // Total calculated pages
  
  // Custom preferences per file
  bool color;
  bool doubleSided;
  int copies;
  
  // Custom page selection:
  // "all" - print all pages
  // "custom" - print selected page indices
  // "range" - print specified range text
  String pageSelectionType; // 'all' | 'custom' | 'range'
  List<int> selectedPages;  // e.g. [1, 2, 4] (1-indexed)
  String rangeText;         // e.g. "1-2, 4"
  
  PrintFile({
    required this.id,
    required this.name,
    this.file,
    this.bytes,
    required this.sizeBytes,
    required this.totalPages,
    this.color = false,
    this.doubleSided = false,
    this.copies = 1,
    this.pageSelectionType = 'all',
    List<int>? selectedPages,
    this.rangeText = '',
  }) : selectedPages = selectedPages ?? List.generate(totalPages, (i) => i + 1);

  // Helper to get number of pages that will actually print
  int get pagesToPrintCount {
    if (pageSelectionType == 'all') {
      return totalPages;
    } else if (pageSelectionType == 'custom') {
      return selectedPages.length;
    } else {
      return parseRangeCount(rangeText, totalPages);
    }
  }

  // Cost calculation for this file
  double calculateCost(Shop shop) {
    final rate = color ? shop.priceColor : shop.priceMono;
    return rate * copies * pagesToPrintCount;
  }

  static int parseRangeCount(String range, int totalPages) {
    if (range.trim().isEmpty) return totalPages;
    final pages = <int>{};
    final parts = range.split(',');
    for (final part in parts) {
      final trimmed = part.trim();
      if (trimmed.contains('-')) {
        final bounds = trimmed.split('-');
        if (bounds.length == 2) {
          final start = int.tryParse(bounds[0].trim());
          final end = int.tryParse(bounds[1].trim());
          if (start != null && end != null) {
            final s = start.clamp(1, totalPages);
            final e = end.clamp(1, totalPages);
            final minVal = s < e ? s : e;
            final maxVal = s > e ? s : e;
            for (int i = minVal; i <= maxVal; i++) {
              pages.add(i);
            }
          }
        }
      } else {
        final pNum = int.tryParse(trimmed);
        if (pNum != null && pNum >= 1 && pNum <= totalPages) {
          pages.add(pNum);
        }
      }
    }
    return pages.isEmpty ? totalPages : pages.length;
  }

  String getFormattedRange() {
    if (pageSelectionType == 'all') {
      return 'All';
    } else if (pageSelectionType == 'custom') {
      if (selectedPages.isEmpty) return 'None';
      final sorted = List<int>.from(selectedPages)..sort();
      return sorted.join(', ');
    } else {
      return rangeText.trim().isEmpty ? 'All' : rangeText;
    }
  }

  /// Human-readable file size string.
  String get formattedSize {
    if (sizeBytes < 1024) return '${sizeBytes}B';
    if (sizeBytes < 1024 * 1024) return '${(sizeBytes / 1024).toStringAsFixed(1)}KB';
    return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  /// File extension (lowercase, without dot).
  String get extension {
    final parts = name.split('.');
    return parts.length > 1 ? parts.last.toLowerCase() : 'file';
  }
}
