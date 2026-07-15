import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart' show kIsWeb, Uint8List, debugPrint;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/supabase_client.dart';
import 'models.dart';

class JobRepository {
  final SupabaseClient _client = SupabaseClientService().client;
  static const String _historyKey = 'xeroxq_print_history';

  // Generate 2-digit code matching the platform standards (00-99)
  String generateToken() {
    final rand = Random.secure();
    return rand.nextInt(100).toString().padLeft(2, '0');
  }

  Future<PrintJob> submitJob({
    required String fileName,
    required String customerName,
    required String customerPhone,
    required String shopId,
    required String shopName,
    required PrintPreferences preferences,
    required int pageCount,
    File? file,
    Uint8List? fileBytes,
  }) async {
    // 1. Prepare Storage Path
    final fileExt = fileName.split('.').last.toLowerCase();
    final randomName = '${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(10000)}.$fileExt';

    // 2. Upload file to 'documents' bucket using correct platform data format
    try {
      if (kIsWeb) {
        if (fileBytes == null) {
          throw Exception('Web upload requires file bytes');
        }
        await _client.storage.from('documents').uploadBinary(
              randomName,
              fileBytes,
              fileOptions: FileOptions(
                contentType: _getContentType(fileExt),
                upsert: true,
              ),
            );
      } else {
        if (file == null) {
          throw Exception('Mobile upload requires File object');
        }
        await _client.storage.from('documents').upload(
              randomName,
              file,
              fileOptions: FileOptions(
                contentType: _getContentType(fileExt),
                upsert: true,
              ),
            );
      }
      debugPrint('Uploaded file successfully: $randomName');
    } catch (e) {
      throw Exception('Failed to upload file to storage: $e');
    }

    // 3. Insert into Database with retry for token collisions
    int retries = 3;
    Map<String, dynamic>? createdJobData;
    String finalToken = '';

    while (retries > 0) {
      finalToken = generateToken();
      final expiresAt = DateTime.now().add(const Duration(hours: 3));

      try {
        final response = await _client.from('jobs').insert({
          'token': finalToken,
          'customer_name': customerName.isEmpty ? 'Guest' : customerName,
          'file_path': randomName,
          'file_name': fileName,
          'preferences': preferences.toJson(),
          'page_count': pageCount,
          'is_preorder': false,
          'is_paid': false,
          'customer_phone': customerPhone,
          'shop_id': shopId,
          'expires_at': expiresAt.toIso8601String(),
        }).select('id, token, customer_name, file_path, file_name, preferences, page_count, is_preorder, is_paid, customer_phone, shop_id, status, expires_at, created_at').single();

        createdJobData = response;
        
        // RPC Increment for analytics
        try {
          await _client.rpc('increment_shop_files', params: {'shop_row_id': shopId});
        } catch (rpcErr) {
          debugPrint('RPC increment failed (non-critical): $rpcErr');
        }
        break;
      } catch (e) {
        debugPrint('DB insert try failed. Error: $e');
        retries--;
        if (retries == 0) {
          // Rollback file if DB insert completely fails
          try {
            await _client.storage.from('documents').remove([randomName]);
          } catch (delErr) {
            debugPrint('Rollback delete failed: $delErr');
          }
          throw Exception('Database job insertion failed: $e');
        }
      }
    }

    if (createdJobData == null) {
      throw Exception('Database insertion returned null payload.');
    }

    final printJob = PrintJob.fromJson(createdJobData);
    await _saveToLocalHistory(printJob);
    return printJob;
  }

  Future<List<PrintJob>> submitMultipleJobs({
    required List<PrintFile> printFiles,
    required String customerName,
    required String customerPhone,
    required String shopId,
    required String shopName,
    required Function(int fileIndex, double progress) onProgress,
  }) async {
    final List<PrintJob> submittedJobs = [];
    
    for (int i = 0; i < printFiles.length; i++) {
      final printFile = printFiles[i];
      
      onProgress(i, 0.1);
      
      // 1. Prepare Storage Path
      final fileExt = printFile.extension;
      final randomName = '${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(10000)}.$fileExt';
      
      // 2. Upload file to 'documents' bucket
      try {
        if (kIsWeb) {
          if (printFile.bytes == null) {
            throw Exception('Web upload requires file bytes');
          }
          await _client.storage.from('documents').uploadBinary(
            randomName,
            printFile.bytes!,
            fileOptions: FileOptions(
              contentType: _getContentType(fileExt),
              upsert: true,
            ),
          );
        } else {
          if (printFile.file == null) {
            throw Exception('Mobile upload requires File object');
          }
          await _client.storage.from('documents').upload(
            randomName,
            printFile.file!,
            fileOptions: FileOptions(
              contentType: _getContentType(fileExt),
              upsert: true,
            ),
          );
        }
      } catch (e) {
        throw Exception('Failed to upload ${printFile.name} to storage: $e');
      }
      
      onProgress(i, 0.6);

      // 3. Insert into Database with retry for token collisions
      int retries = 3;
      Map<String, dynamic>? createdJobData;
      String finalToken = '';

      while (retries > 0) {
        finalToken = generateToken();
        final expiresAt = DateTime.now().add(const Duration(hours: 3));

        try {
          final preferences = PrintPreferences(
            color: printFile.color,
            copies: printFile.copies,
            doubleSided: printFile.doubleSided,
            range: printFile.getFormattedRange(),
          );

          final response = await _client.from('jobs').insert({
            'token': finalToken,
            'customer_name': customerName.isEmpty ? 'Guest' : customerName,
            'file_path': randomName,
            'file_name': printFile.name,
            'preferences': preferences.toJson(),
            'page_count': printFile.pagesToPrintCount,
            'is_preorder': false,
            'is_paid': false,
            'customer_phone': customerPhone,
            'shop_id': shopId,
            'expires_at': expiresAt.toIso8601String(),
          }).select('id, token, customer_name, file_path, file_name, preferences, page_count, is_preorder, is_paid, customer_phone, shop_id, status, expires_at, created_at').single();

          createdJobData = response;
          
          // RPC Increment for analytics
          try {
            await _client.rpc('increment_shop_files', params: {'shop_row_id': shopId});
          } catch (rpcErr) {
            debugPrint('RPC increment failed (non-critical): $rpcErr');
          }
          break;
        } catch (e) {
          debugPrint('DB insert try failed. Error: $e');
          retries--;
          if (retries == 0) {
            // Rollback file if DB insert completely fails
            try {
              await _client.storage.from('documents').remove([randomName]);
            } catch (delErr) {
              debugPrint('Rollback delete failed: $delErr');
            }
            throw Exception('Database job insertion failed for ${printFile.name}: $e');
          }
        }
      }

      if (createdJobData == null) {
        throw Exception('Database insertion returned null payload.');
      }

      final printJob = PrintJob.fromJson(createdJobData);
      submittedJobs.add(printJob);
      onProgress(i, 1.0);
    }
    
    // Save all to local history
    if (submittedJobs.isNotEmpty) {
      final prefs = await SharedPreferences.getInstance();
      final list = await getCachedHistory();
      list.insertAll(0, submittedJobs);
      
      final jsonStr = json.encode(list.map((j) => j.toJson()).toList());
      await prefs.setString(_historyKey, jsonStr);
    }
    
    return submittedJobs;
  }

  String _getContentType(String fileExt) {
    switch (fileExt) {
      case 'pdf': return 'application/pdf';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'txt': return 'text/plain';
      default: return 'application/octet-stream';
    }
  }

  // Local caching for History screen
  Future<void> _saveToLocalHistory(PrintJob job) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getCachedHistory();
    list.insert(0, job);
    
    final jsonStr = json.encode(list.map((j) => j.toJson()).toList());
    await prefs.setString(_historyKey, jsonStr);
  }

  Future<List<PrintJob>> getCachedHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_historyKey);
    if (jsonStr == null) return [];
    try {
      final List<dynamic> list = json.decode(jsonStr) as List<dynamic>;
      return list.map((item) => PrintJob.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('History decode failed: $e');
      return [];
    }
  }

  // Real-time tracking
  Stream<List<Map<String, dynamic>>> trackJob(String jobId) {
    return _client
        .from('jobs')
        .stream(primaryKey: ['id'])
        .eq('id', jobId);
  }

  Stream<List<Map<String, dynamic>>> streamJobStatus(String jobId) => trackJob(jobId);

  Future<PrintJob> getJobStatus(String jobId) async {
    final response = await _client
        .from('jobs')
        .select('id, token, customer_name, file_path, file_name, preferences, page_count, is_preorder, is_paid, customer_phone, shop_id, status, expires_at, created_at')
        .eq('id', jobId)
        .single();
    return PrintJob.fromJson(response);
  }

  Future<List<PrintJob>> syncHistoryWithDatabase() async {
    final cached = await getCachedHistory();
    if (cached.isEmpty) return [];
    
    final ids = cached.map((j) => j.id).toList();
    try {
      final response = await _client
          .from('jobs')
          .select('id, token, customer_name, file_path, file_name, preferences, page_count, is_preorder, is_paid, customer_phone, shop_id, status, expires_at, created_at')
          .inFilter('id', ids);
      
      final List<dynamic> data = response as List<dynamic>;
      final latestJobs = data.map((json) => PrintJob.fromJson(json as Map<String, dynamic>)).toList();
      
      final Map<String, PrintJob> latestMap = {for (var j in latestJobs) j.id: j};
      final updatedList = cached.map((cachedJob) {
        return latestMap[cachedJob.id] ?? cachedJob;
      }).toList();
      
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = json.encode(updatedList.map((j) => j.toJson()).toList());
      await prefs.setString(_historyKey, jsonStr);
      
      return updatedList;
    } catch (e) {
      debugPrint('Failed to sync history with database: $e');
      return cached;
    }
  }

  Future<void> deleteJobByUser(String jobId) async {
    try {
      await _client
          .from('jobs')
          .update({'is_deleted_by_user': true})
          .eq('id', jobId);
    } catch (e) {
      debugPrint('Failed to mark job as deleted in Supabase: $e');
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = await getCachedHistory();
      cached.removeWhere((j) => j.id == jobId);
      final jsonStr = json.encode(cached.map((j) => j.toJson()).toList());
      await prefs.setString(_historyKey, jsonStr);
    } catch (e) {
      debugPrint('Failed to remove job from local history cache: $e');
    }
  }

  Future<PrintJob> submitQuickReorder({
    required PrintJob oldJob,
    required String shopId,
    required bool color,
    required int copies,
  }) async {
    // Generate unique 2-digit pickup token (retry on collision)
    String token = '';
    for (int retry = 0; retry < 5; retry++) {
      token = (Random().nextInt(90) + 10).toString();
      final collisionCheck = await _client
          .from('jobs')
          .select('id')
          .eq('shop_id', shopId)
          .eq('token', token)
          .eq('status', 'pending')
          .maybeSingle();
      if (collisionCheck == null) {
        break;
      }
    }

    final newPrefs = PrintPreferences(
      color: color,
      doubleSided: oldJob.preferences.doubleSided,
      copies: copies,
      range: oldJob.preferences.range,
    );

    final response = await _client.from('jobs').insert({
      'token': token,
      'customer_name': oldJob.customerName,
      'customer_phone': oldJob.customerPhone,
      'file_path': oldJob.filePath,
      'file_name': oldJob.fileName,
      'preferences': newPrefs.toJson(),
      'page_count': oldJob.pageCount,
      'is_preorder': true,
      'is_paid': false,
      'shop_id': shopId,
      'status': 'pending',
      'expires_at': DateTime.now().add(const Duration(hours: 24)).toIso8601String(),
    }).select().single();

    final newJob = PrintJob.fromJson(response);
    await _saveToLocalHistory(newJob);
    return newJob;
  }
}
