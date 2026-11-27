import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb, Uint8List, debugPrint;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../core/local_storage.dart';
import 'models.dart';

/// Repository for the user's local document vault.
/// Uses Hive for metadata + file-system (mobile) or Hive box (web) for binary files.
class VaultRepository {
  // ── Read ────────────────────────────────────────────────────────

  Future<List<VaultDocument>> getDocuments() async {
    final raw = LocalStorageService.getAllDocuments();
    final docs = raw.map(VaultDocument.fromJson).toList();
    // Newest first
    docs.sort((a, b) => b.dateAdded.compareTo(a.dateAdded));
    return docs;
  }

  Future<List<VaultDocument>> getFavourites() async {
    final all = await getDocuments();
    return all.where((d) => d.isFavourite).toList();
  }

  Future<List<VaultDocument>> getRecentDocuments({int limit = 6}) async {
    final recentIds = LocalStorageService.recentDocIds;
    if (recentIds.isEmpty) {
      final all = await getDocuments();
      return all.take(limit).toList();
    }
    final result = <VaultDocument>[];
    for (final id in recentIds.take(limit)) {
      final raw = LocalStorageService.getDocument(id);
      if (raw != null) result.add(VaultDocument.fromJson(raw));
    }
    return result;
  }

  // Helper to read bytes for any vault document (AES-256 decrypted from Hive, with legacy file fallback)
  Future<Uint8List> getDocumentBytes(VaultDocument doc) async {
    final encryptedBytes = LocalStorageService.getBytes(doc.id);
    if (encryptedBytes != null) {
      return encryptedBytes;
    }

    if (!kIsWeb && !doc.localPath.startsWith('vault_box://') && !doc.localPath.startsWith('web_vault://')) {
      final legacyFile = File(doc.localPath);
      if (await legacyFile.exists()) {
        final bytes = await legacyFile.readAsBytes();
        // Migrate legacy plaintext file into AES-256 encrypted box and delete plaintext copy
        await LocalStorageService.saveBytes(doc.id, bytes);
        try {
          await legacyFile.delete();
        } catch (e) {
          debugPrint('Failed to clean legacy plaintext vault file: $e');
        }
        return bytes;
      }
    }
    throw Exception('Encrypted document bytes not found in vault.');
  }

  /// Writes a short-lived temporary file strictly when native OS viewer/share API requires a file path.
  Future<File> materializeTempFile(VaultDocument doc) async {
    final bytes = await getDocumentBytes(doc);
    final tempDir = await getTemporaryDirectory();
    final previewDir = Directory(p.join(tempDir.path, 'xeroxq_vault_preview'));
    if (!await previewDir.exists()) {
      await previewDir.create(recursive: true);
    }
    final safeName = doc.name.replaceAll(RegExp(r'[^a-zA-Z0-9._\-]'), '_');
    final tempFile = File(p.join(previewDir.path, '${doc.id}_$safeName'));
    await tempFile.writeAsBytes(bytes, flush: true);
    return tempFile;
  }

  // ── Write ───────────────────────────────────────────────────────

  Future<VaultDocument> addFileToVault({
    File? sourceFile,
    Uint8List? sourceBytes,
    required String name,
    String category = 'Others',
    List<String> tags = const [],
  }) async {
    final id = const Uuid().v4();
    Uint8List bytes;

    if (sourceBytes != null) {
      bytes = sourceBytes;
    } else if (!kIsWeb && sourceFile != null) {
      bytes = await sourceFile.readAsBytes();
    } else {
      throw Exception('Document bytes or source file required');
    }

    await LocalStorageService.saveBytes(id, bytes);
    final destPath = kIsWeb ? 'web_vault://$id/$name' : 'vault_box://$id/${p.basename(name)}';

    final doc = VaultDocument(
      id: id,
      name: name,
      localPath: destPath,
      sizeBytes: bytes.length,
      category: category,
      dateAdded: DateTime.now(),
      tags: tags,
    );

    await LocalStorageService.putDocument(id, doc.toJson());
    await LocalStorageService.pushRecentDoc(id);
    return doc;
  }

  Future<void> toggleFavourite(String id) async {
    final raw = LocalStorageService.getDocument(id);
    if (raw == null) return;
    final doc = VaultDocument.fromJson(raw);
    doc.isFavourite = !doc.isFavourite;
    await LocalStorageService.putDocument(id, doc.toJson());
  }

  Future<void> renameDocument(String id, String newName) async {
    final raw = LocalStorageService.getDocument(id);
    if (raw == null) return;
    final updated = Map<String, dynamic>.from(raw);
    updated['name'] = newName;
    await LocalStorageService.putDocument(id, updated);
  }

  Future<void> recategorise(String id, String category) async {
    final raw = LocalStorageService.getDocument(id);
    if (raw == null) return;
    final updated = Map<String, dynamic>.from(raw);
    updated['category'] = category;
    await LocalStorageService.putDocument(id, updated);
  }

  Future<void> markRecentlyAccessed(String id) async {
    await LocalStorageService.pushRecentDoc(id);
  }

  Future<void> deleteDocument(String id) async {
    final raw = LocalStorageService.getDocument(id);
    if (raw != null) {
      try {
        await LocalStorageService.deleteBytes(id);
        if (!kIsWeb) {
          final localPath = raw['localPath'] as String? ?? '';
          if (localPath.isNotEmpty && !localPath.startsWith('vault_box://')) {
            final file = File(localPath);
            if (await file.exists()) await file.delete();
          }
          final thumb = raw['thumbnailPath'] as String?;
          if (thumb != null) {
            final thumbFile = File(thumb);
            if (await thumbFile.exists()) await thumbFile.delete();
          }
        }
      } catch (e) {
        debugPrint('Error deleting vault file: $e');
      }
    }
    await LocalStorageService.deleteDocument(id);
  }

  // ── Storage stats ───────────────────────────────────────────────

  int totalUsedBytes() => LocalStorageService.totalStorageUsed();

  // ── Lock ────────────────────────────────────────────────────────

  Future<bool> isLockEnabled() async => LocalStorageService.isLockEnabled;
  Future<void> setLockEnabled(bool v) async =>
      LocalStorageService.setLockEnabled(v);
}
