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

  // Helper to read bytes for any vault document (both web and mobile)
  Future<Uint8List> getDocumentBytes(VaultDocument doc) async {
    if (kIsWeb) {
      final bytes = LocalStorageService.getBytes(doc.id);
      if (bytes != null) return bytes;
      throw Exception('Bytes not found in local vault.');
    } else {
      final file = File(doc.localPath);
      if (await file.exists()) {
        return await file.readAsBytes();
      }
      throw Exception('Local file not found at ${doc.localPath}');
    }
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
    String destPath = '';
    int sizeBytes = 0;

    if (kIsWeb) {
      if (sourceBytes == null) {
        throw Exception('Bytes required for web upload');
      }
      sizeBytes = sourceBytes.length;
      destPath = 'web_vault://$id/$name';
      await LocalStorageService.saveBytes(id, sourceBytes);
    } else {
      if (sourceFile == null) {
        throw Exception('Source file required for mobile/desktop upload');
      }
      final appDir = await getApplicationDocumentsDirectory();
      final vaultDir = Directory(p.join(appDir.path, 'xeroxq_vault'));
      if (!await vaultDir.exists()) {
        await vaultDir.create(recursive: true);
      }

      final fileExt = p.extension(sourceFile.path);
      destPath = p.join(vaultDir.path, '$id$fileExt');

      final File localCopy = await sourceFile.copy(destPath);
      sizeBytes = await localCopy.length();
    }

    final doc = VaultDocument(
      id: id,
      name: name,
      localPath: destPath,
      sizeBytes: sizeBytes,
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
        if (kIsWeb) {
          await LocalStorageService.deleteBytes(id);
        } else {
          final file = File(raw['localPath'] as String);
          if (await file.exists()) await file.delete();
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
