import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart' show kIsWeb, Uint8List, debugPrint;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

/// Encrypted Hive-backed local storage service for VaultDocument metadata & bytes.
class LocalStorageService {
  static const String _vaultBox = 'vault_documents';
  static const String _vaultBytesBox = 'vault_bytes';
  static const String _settingsBox = 'vault_settings';
  static const String _secureKeyStorageName = 'xeroxq_vault_aes256_key_v1';

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static late Box<dynamic> _vault;
  static late Box<dynamic> _vaultBytes;
  static late Box<dynamic> _settings;

  static Future<List<int>> _getOrCreateVaultCipherKey() async {
    final existing = await _secureStorage.read(key: _secureKeyStorageName);
    if (existing != null && existing.isNotEmpty) {
      try {
        final decoded = base64Decode(existing);
        if (decoded.length == 32) {
          return decoded;
        }
      } catch (e) {
        debugPrint('Corrupted stored vault key; regenerating: $e');
      }
    }

    final random = Random.secure();
    final key = List<int>.generate(32, (_) => random.nextInt(256));
    await _secureStorage.write(
      key: _secureKeyStorageName,
      value: base64Encode(key),
    );
    return key;
  }

  static Future<Box<dynamic>> _openEncryptedBox(
    String boxName,
    HiveAesCipher cipher,
  ) async {
    try {
      return await Hive.openBox(boxName, encryptionCipher: cipher);
    } catch (_) {
      // One-time seamless migration if a legacy unencrypted box already exists on disk
      final legacyBox = await Hive.openBox(boxName);
      final snapshot = Map<dynamic, dynamic>.from(legacyBox.toMap());
      await legacyBox.close();
      await Hive.deleteBoxFromDisk(boxName);

      final encryptedBox = await Hive.openBox(boxName, encryptionCipher: cipher);
      if (snapshot.isNotEmpty) {
        await encryptedBox.putAll(snapshot);
      }
      return encryptedBox;
    }
  }

  /// Call once in main() before runApp.
  static Future<void> initialize({List<int>? cipherKey}) async {
    if (kIsWeb) {
      await Hive.initFlutter();
    } else {
      final appDocDir = await getApplicationDocumentsDirectory();
      await Hive.initFlutter(appDocDir.path);
    }

    final resolvedKey = (cipherKey != null && cipherKey.length == 32)
        ? cipherKey
        : await _getOrCreateVaultCipherKey();

    final cipher = HiveAesCipher(resolvedKey);

    _vault = await _openEncryptedBox(_vaultBox, cipher);
    _vaultBytes = await _openEncryptedBox(_vaultBytesBox, cipher);
    _settings = await Hive.openBox(_settingsBox);
  }

  // ── Vault documents ─────────────────────────────────────────────
  static Box<dynamic> get vaultBox => _vault;

  static List<Map<String, dynamic>> getAllDocuments() {
    return _vault.values
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  static Future<void> putDocument(String id, Map<String, dynamic> data) async {
    await _vault.put(id, data);
  }

  static Future<void> deleteDocument(String id) async {
    await _vault.delete(id);
  }

  static Map<String, dynamic>? getDocument(String id) {
    final raw = _vault.get(id);
    if (raw == null) return null;
    return Map<String, dynamic>.from(raw as Map);
  }

  // ── Web File Bytes storage ──────────────────────────────────────
  static Future<void> saveBytes(String id, Uint8List bytes) async {
    await _vaultBytes.put(id, bytes);
  }

  static Uint8List? getBytes(String id) {
    final data = _vaultBytes.get(id);
    if (data == null) return null;
    return data as Uint8List;
  }

  static Future<void> deleteBytes(String id) async {
    await _vaultBytes.delete(id);
  }

  // ── Settings ─────────────────────────────────────────────────────
  static Box<dynamic> get settingsBox => _settings;

  static bool get isLockEnabled => _settings.get('lock_enabled', defaultValue: false) as bool;
  static Future<void> setLockEnabled(bool v) => _settings.put('lock_enabled', v);

  static List<String> get recentDocIds {
    final raw = _settings.get('recent_doc_ids');
    if (raw == null) return [];
    return List<String>.from(raw as List);
  }

  static Future<void> pushRecentDoc(String id) async {
    final ids = recentDocIds;
    ids.remove(id);
    ids.insert(0, id);
    if (ids.length > 8) ids.removeLast();
    await _settings.put('recent_doc_ids', ids);
  }

  /// Total bytes used by all stored vault documents.
  static int totalStorageUsed() {
    return getAllDocuments().fold(0, (acc, doc) {
      return acc + ((doc['sizeBytes'] as int?) ?? 0);
    });
  }
}
