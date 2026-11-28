import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Result returned when the user saves their adjusted / cropped image.
class ImageAdjustResult {
  final Uint8List bytes;
  final bool autoOrManualCropped;

  const ImageAdjustResult({
    required this.bytes,
    required this.autoOrManualCropped,
  });
}

enum _AspectPreset {
  free('Free', null),
  idCard('Aadhaar / ID', 85.6 / 54.0),
  passport('Passport', 35.0 / 45.0),
  a4('A4 Doc', 210.0 / 297.0),
  square('Square', 1.0);

  final String label;
  final double? aspect;
  const _AspectPreset(this.label, this.aspect);
}

enum _FilterPreset {
  original('Original'),
  idBoost('ID Boost'),
  cleanDoc('Clean B&W'),
  vivid('Vivid');

  final String label;
  const _FilterPreset(this.label);
}

enum _DragHandle { move, nw, ne, sw, se }

class _AutoBounds {
  final Rect normalized; // [0..1]
  final bool trimmed;
  const _AutoBounds(this.normalized, this.trimmed);
}

Future<ui.Image> _decodeUiImage(Uint8List bytes) {
  final completer = Completer<ui.Image>();
  ui.decodeImageFromList(bytes, completer.complete);
  return completer.future;
}

/// Estimates document / card bounding box by sampling background margins along
/// the outer ring and measuring color distance + edge gradients.
Future<_AutoBounds> _detectBoundsFromUiImage(ui.Image src) async {
  final natW = src.width;
  final natH = src.height;
  const full = Rect.fromLTWH(0, 0, 1, 1);
  if (natW < 80 || natH < 80) return const _AutoBounds(full, false);

  // Render onto compact <=180px image for fast mobile edge scanning
  const maxDim = 180;
  final scale = math.min(1.0, maxDim / math.max(natW, natH));
  final w = math.max(24, (natW * scale).round());
  final h = math.max(24, (natH * scale).round());

  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  canvas.drawImageRect(
    src,
    Rect.fromLTWH(0, 0, natW.toDouble(), natH.toDouble()),
    Rect.fromLTWH(0, 0, w.toDouble(), h.toDouble()),
    Paint()..filterQuality = FilterQuality.medium,
  );
  final scaledImg = await recorder.endRecording().toImage(w, h);
  final byteData = await scaledImg.toByteData(format: ui.ImageByteFormat.rawRgba);
  scaledImg.dispose();
  if (byteData == null) return const _AutoBounds(full, false);

  final data = byteData.buffer.asUint8List();
  final borderPadX = math.max(2, (w * 0.04).floor());
  final borderPadY = math.max(2, (h * 0.04).floor());

  double bgR = 0, bgG = 0, bgB = 0;
  int bgCount = 0;
  final luma = Float32List(w * h);

  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      final p = y * w + x;
      final idx = p * 4;
      final r = data[idx].toDouble();
      final g = data[idx + 1].toDouble();
      final b = data[idx + 2].toDouble();
      luma[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      if (x < borderPadX || x >= w - borderPadX || y < borderPadY || y >= h - borderPadY) {
        bgR += r;
        bgG += g;
        bgB += b;
        bgCount++;
      }
    }
  }
  if (bgCount == 0) return const _AutoBounds(full, false);
  bgR /= bgCount;
  bgG /= bgCount;
  bgB /= bgCount;

  double spreadSum = 0;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      if (x < borderPadX || x >= w - borderPadX || y < borderPadY || y >= h - borderPadY) {
        final idx = (y * w + x) * 4;
        spreadSum += (data[idx] - bgR).abs() +
            (data[idx + 1] - bgG).abs() +
            (data[idx + 2] - bgB).abs();
      }
    }
  }
  final avgSpread = spreadSum / (bgCount * 3);
  final colorThreshold = (22.0 + avgSpread * 0.7).clamp(22.0, 58.0);

  final rowCounts = Int32List(h);
  final colCounts = Int32List(w);

  for (int y = 1; y < h - 1; y++) {
    for (int x = 1; x < w - 1; x++) {
      final p = y * w + x;
      final idx = p * 4;
      final dist = ((data[idx] - bgR).abs() +
              (data[idx + 1] - bgG).abs() +
              (data[idx + 2] - bgB).abs()) /
          3.0;
      final gx = (luma[p + 1] - luma[p - 1]).abs();
      final gy = (luma[p + w] - luma[p - w]).abs();
      final grad = (gx + gy) * 0.5;
      if (dist > colorThreshold || grad > 24.0) {
        rowCounts[y]++;
        colCounts[x]++;
      }
    }
  }

  final minCol = math.max(2, (h * 0.04).floor());
  final minRow = math.max(2, (w * 0.04).floor());

  int minX = 0, maxX = w - 1, minY = 0, maxY = h - 1;
  while (minX < w - 1 && colCounts[minX] < minCol) {
    minX++;
  }
  while (maxX > minX + 10 && colCounts[maxX] < minCol) {
    maxX--;
  }
  while (minY < h - 1 && rowCounts[minY] < minRow) {
    minY++;
  }
  while (maxY > minY + 10 && rowCounts[maxY] < minRow) {
    maxY--;
  }

  final padX = math.max(2, ((maxX - minX) * 0.025).round());
  final padY = math.max(2, ((maxY - minY) * 0.025).round());
  minX = math.max(0, minX - padX);
  maxX = math.min(w - 1, maxX + padX);
  minY = math.max(0, minY - padY);
  maxY = math.min(h - 1, maxY + padY);

  final normX = minX / w;
  final normY = minY / h;
  final normW = math.max(0.15, (maxX - minX + 1) / w);
  final normH = math.max(0.15, (maxY - minY + 1) / h);
  final area = normW * normH;

  final trimmed = area <= 0.94 && area >= 0.16;
  if (!trimmed) return const _AutoBounds(full, false);

  return _AutoBounds(
    Rect.fromLTWH(
      normX.clamp(0.0, 0.85),
      normY.clamp(0.0, 0.85),
      normW.clamp(0.15, 1.0 - normX),
      normH.clamp(0.15, 1.0 - normY),
    ),
    true,
  );
}

Future<Uint8List> _renderCroppedImage({
  required ui.Image src,
  required Rect cropNorm,
  required int quarterTurns,
  required _FilterPreset filter,
}) async {
  final swapsDims = quarterTurns % 2 == 1;
  final rotW = (swapsDims ? src.height : src.width).toDouble();
  final rotH = (swapsDims ? src.width : src.height).toDouble();

  final cropPx = Rect.fromLTWH(
    (cropNorm.left * rotW).roundToDouble(),
    (cropNorm.top * rotH).roundToDouble(),
    math.max(24, (cropNorm.width * rotW).roundToDouble()),
    math.max(24, (cropNorm.height * rotH).roundToDouble()),
  );

  // Cap output longest side to 2400px for crisp printing without OOM on phones
  final outScale = math.min(1.0, 2400.0 / math.max(cropPx.width, cropPx.height));
  final outW = math.max(24, (cropPx.width * outScale).round());
  final outH = math.max(24, (cropPx.height * outScale).round());

  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  canvas.drawRect(
    Rect.fromLTWH(0, 0, outW.toDouble(), outH.toDouble()),
    Paint()..color = Colors.white,
  );

  canvas.scale(outScale, outScale);
  canvas.translate(-cropPx.left, -cropPx.top);

  // Rotate around rotated-space center
  canvas.translate(rotW / 2, rotH / 2);
  canvas.rotate(quarterTurns * (math.pi / 2));
  canvas.translate(-src.width / 2, -src.height / 2);

  final paint = Paint()..filterQuality = FilterQuality.high;
  switch (filter) {
    case _FilterPreset.original:
      break;
    case _FilterPreset.cleanDoc:
      // High-contrast crisp grayscale document scan
      paint.colorFilter = const ColorFilter.matrix(<double>[
        0.42, 1.08, 0.14, 0, -36,
        0.42, 1.08, 0.14, 0, -36,
        0.42, 1.08, 0.14, 0, -36,
        0,    0,    0,    1,   0,
      ]);
      break;
    case _FilterPreset.idBoost:
      paint.colorFilter = const ColorFilter.matrix(<double>[
        1.18, 0, 0, 0, -8,
        0, 1.18, 0, 0, -8,
        0, 0, 1.18, 0, -8,
        0, 0, 0, 1, 0,
      ]);
      break;
    case _FilterPreset.vivid:
      paint.colorFilter = const ColorFilter.matrix(<double>[
        1.22, -0.08, -0.08, 0, 2,
        -0.08, 1.22, -0.08, 0, 2,
        -0.08, -0.08, 1.22, 0, 2,
        0, 0, 0, 1, 0,
      ]);
      break;
  }

  canvas.drawImage(src, Offset.zero, paint);
  final outImage = await recorder.endRecording().toImage(outW, outH);
  final byteData = await outImage.toByteData(format: ui.ImageByteFormat.png);
  outImage.dispose();
  if (byteData == null) {
    throw Exception('Failed to encode cropped image');
  }
  return byteData.buffer.asUint8List();
}

/// Automatically trims messy desk/table outer borders around an Aadhaar card or
/// document photo when clear margins are detected. Returns the original bytes untouched
/// if no significant border was detected.
Future<ImageAdjustResult> autoCropBytesIfDocument(Uint8List originalBytes) async {
  try {
    final img = await _decodeUiImage(originalBytes);
    try {
      final bounds = await _detectBoundsFromUiImage(img);
      if (!bounds.trimmed) {
        return ImageAdjustResult(bytes: originalBytes, autoOrManualCropped: false);
      }
      final cropped = await _renderCroppedImage(
        src: img,
        cropNorm: bounds.normalized,
        quarterTurns: 0,
        filter: _FilterPreset.original,
      );
      return ImageAdjustResult(bytes: cropped, autoOrManualCropped: true);
    } finally {
      img.dispose();
    }
  } catch (e) {
    debugPrint('Auto-crop skipped cleanly: $e');
    return ImageAdjustResult(bytes: originalBytes, autoOrManualCropped: false);
  }
}

/// Full-screen interactive document / Aadhaar / photo cropper & enhancer.
class ImageAdjustPage extends StatefulWidget {
  final Uint8List imageBytes;
  final String fileName;

  const ImageAdjustPage({
    super.key,
    required this.imageBytes,
    required this.fileName,
  });

  @override
  State<ImageAdjustPage> createState() => _ImageAdjustPageState();
}

class _ImageAdjustPageState extends State<ImageAdjustPage> {
  ui.Image? _decoded;
  Rect _cropNorm = const Rect.fromLTWH(0, 0, 1, 1);
  int _quarterTurns = 0;
  _AspectPreset _preset = _AspectPreset.free;
  _FilterPreset _filter = _FilterPreset.original;
  bool _busy = true;
  bool _saving = false;
  String? _statusBanner;

  _DragHandle? _activeHandle;
  Offset? _dragStartPt;
  Rect? _dragStartRect;
  Size _stageSize = Size.zero;

  static const double _minFrac = 0.12;

  @override
  void initState() {
    super.initState();
    _initImage();
  }

  @override
  void dispose() {
    _decoded?.dispose();
    super.dispose();
  }

  Future<void> _initImage() async {
    try {
      final img = await _decodeUiImage(widget.imageBytes);
      final bounds = await _detectBoundsFromUiImage(img);
      if (!mounted) {
        img.dispose();
        return;
      }
      setState(() {
        _decoded = img;
        _cropNorm = bounds.normalized;
        _busy = false;
        _statusBanner = bounds.trimmed
            ? 'Smart edges detected — drag corners to adjust'
            : null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
    }
  }

  double get _rotatedAspect {
    if (_decoded == null) return 1.0;
    final swap = _quarterTurns % 2 == 1;
    final w = swap ? _decoded!.height : _decoded!.width;
    final h = swap ? _decoded!.width : _decoded!.height;
    return w / math.max(1, h);
  }

  Future<void> _runAutoScan() async {
    if (_decoded == null) return;
    setState(() => _busy = true);
    final bounds = await _detectBoundsFromUiImage(_decoded!);
    if (!mounted) return;

    // Transform normalized bounds if rotated
    Rect r = bounds.normalized;
    for (int i = 0; i < (_quarterTurns % 4); i++) {
      r = Rect.fromLTWH(1.0 - r.bottom, r.left, r.height, r.width);
    }
    setState(() {
      _preset = _AspectPreset.free;
      _cropNorm = r;
      _busy = false;
      _statusBanner = bounds.trimmed
          ? 'Auto-framed document — drag corners to refine'
          : 'No clear outer margin found — drag corners manually';
    });
  }

  void _selectPreset(_AspectPreset preset) {
    setState(() {
      _preset = preset;
      _statusBanner = null;
      if (preset.aspect != null) {
        final imgAspect = _rotatedAspect;
        final target = preset.aspect!;
        double w, h;
        if (target > imgAspect) {
          w = 0.88;
          h = (w * imgAspect) / target;
        } else {
          h = 0.88;
          w = (h * target) / imgAspect;
        }
        w = w.clamp(0.15, 0.94);
        h = h.clamp(0.15, 0.94);
        _cropNorm = Rect.fromLTWH((1 - w) / 2, (1 - h) / 2, w, h);
      }
    });
  }

  void _rotateRight90() {
    setState(() {
      _quarterTurns = (_quarterTurns + 1) % 4;
      final r = _cropNorm;
      _cropNorm = Rect.fromLTWH(1.0 - r.bottom, r.left, r.height, r.width);
      _statusBanner = null;
    });
  }

  void _resetFull() {
    setState(() {
      _quarterTurns = 0;
      _preset = _AspectPreset.free;
      _filter = _FilterPreset.original;
      _cropNorm = const Rect.fromLTWH(0, 0, 1, 1);
      _statusBanner = null;
    });
  }

  void _onPanStart(Offset localPos, Size stageSize) {
    _stageSize = stageSize;
    final box = Rect.fromLTWH(
      _cropNorm.left * stageSize.width,
      _cropNorm.top * stageSize.height,
      _cropNorm.width * stageSize.width,
      _cropNorm.height * stageSize.height,
    );

    const hitRadius = 28.0;
    _DragHandle? picked;
    if ((localPos - box.topLeft).distance <= hitRadius) {
      picked = _DragHandle.nw;
    } else if ((localPos - box.topRight).distance <= hitRadius) {
      picked = _DragHandle.ne;
    } else if ((localPos - box.bottomLeft).distance <= hitRadius) {
      picked = _DragHandle.sw;
    } else if ((localPos - box.bottomRight).distance <= hitRadius) {
      picked = _DragHandle.se;
    } else if (box.inflate(10).contains(localPos)) {
      picked = _DragHandle.move;
    }

    if (picked == null) return;
    _activeHandle = picked;
    _dragStartPt = localPos;
    _dragStartRect = _cropNorm;
  }

  void _onPanUpdate(Offset localPos) {
    if (_activeHandle == null || _dragStartPt == null || _dragStartRect == null) return;
    if (_stageSize.width <= 1 || _stageSize.height <= 1) return;

    final dx = (localPos.dx - _dragStartPt!.dx) / _stageSize.width;
    final dy = (localPos.dy - _dragStartPt!.dy) / _stageSize.height;
    final s = _dragStartRect!;

    if (_activeHandle == _DragHandle.move) {
      final nx = (s.left + dx).clamp(0.0, 1.0 - s.width);
      final ny = (s.top + dy).clamp(0.0, 1.0 - s.height);
      setState(() => _cropNorm = Rect.fromLTWH(nx, ny, s.width, s.height));
      return;
    }

    double left = s.left;
    double top = s.top;
    double right = s.right;
    double bottom = s.bottom;

    if (_activeHandle == _DragHandle.nw || _activeHandle == _DragHandle.sw) {
      left = (s.left + dx).clamp(0.0, right - _minFrac);
    }
    if (_activeHandle == _DragHandle.ne || _activeHandle == _DragHandle.se) {
      right = (s.right + dx).clamp(left + _minFrac, 1.0);
    }
    if (_activeHandle == _DragHandle.nw || _activeHandle == _DragHandle.ne) {
      top = (s.top + dy).clamp(0.0, bottom - _minFrac);
    }
    if (_activeHandle == _DragHandle.sw || _activeHandle == _DragHandle.se) {
      bottom = (s.bottom + dy).clamp(top + _minFrac, 1.0);
    }

    double w = right - left;
    double h = bottom - top;

    if (_preset.aspect != null) {
      final normAspect = _preset.aspect! / _rotatedAspect;
      h = w / normAspect;
      if (_activeHandle == _DragHandle.nw || _activeHandle == _DragHandle.ne) {
        top = bottom - h;
        if (top < 0) {
          top = 0;
          h = bottom;
          w = h * normAspect;
          if (_activeHandle == _DragHandle.nw) left = right - w;
        }
      } else {
        if (top + h > 1.0) {
          h = 1.0 - top;
          w = h * normAspect;
          if (_activeHandle == _DragHandle.sw) left = right - w;
        }
      }
    }

    setState(() {
      _cropNorm = Rect.fromLTWH(
        left.clamp(0.0, 1.0 - _minFrac),
        top.clamp(0.0, 1.0 - _minFrac),
        w.clamp(_minFrac, 1.0 - left.clamp(0.0, 1.0 - _minFrac)),
        h.clamp(_minFrac, 1.0 - top.clamp(0.0, 1.0 - _minFrac)),
      );
    });
  }

  void _onPanEnd() {
    _activeHandle = null;
    _dragStartPt = null;
    _dragStartRect = null;
  }

  Future<void> _saveAndReturn() async {
    if (_decoded == null || _saving) return;
    setState(() => _saving = true);
    try {
      final outBytes = await _renderCroppedImage(
        src: _decoded!,
        cropNorm: _cropNorm,
        quarterTurns: _quarterTurns,
        filter: _filter,
      );
      if (!mounted) return;
      final changed = _quarterTurns != 0 ||
          _filter != _FilterPreset.original ||
          _cropNorm.width < 0.99 ||
          _cropNorm.height < 0.99;
      Navigator.pop(
        context,
        ImageAdjustResult(bytes: outBytes, autoOrManualCropped: changed),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not crop image: $e')),
      );
    }
  }

  ColorFilter? _previewFilter() {
    switch (_filter) {
      case _FilterPreset.original:
        return null;
      case _FilterPreset.cleanDoc:
        return const ColorFilter.matrix(<double>[
          0.42, 1.08, 0.14, 0, -36,
          0.42, 1.08, 0.14, 0, -36,
          0.42, 1.08, 0.14, 0, -36,
          0,    0,    0,    1,   0,
        ]);
      case _FilterPreset.idBoost:
        return const ColorFilter.matrix(<double>[
          1.18, 0, 0, 0, -8,
          0, 1.18, 0, 0, -8,
          0, 0, 1.18, 0, -8,
          0, 0, 0, 1, 0,
        ]);
      case _FilterPreset.vivid:
        return const ColorFilter.matrix(<double>[
          1.22, -0.08, -0.08, 0, 2,
          -0.08, 1.22, -0.08, 0, 2,
          -0.08, -0.08, 1.22, 0, 2,
          0, 0, 0, 1, 0,
        ]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF111318),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111318),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Crop & Adjust Photo',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            Text(
              widget.fileName,
              style: const TextStyle(fontSize: 11, color: Colors.white60),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: _busy ? null : _runAutoScan,
            icon: const Icon(Icons.document_scanner_outlined, size: 17, color: Color(0xFF60A5FA)),
            label: const Text(
              'Auto-Crop',
              style: TextStyle(color: Color(0xFF60A5FA), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Presets Bar
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: _AspectPreset.values.map((p) {
                final selected = _preset == p;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(p.label),
                    selected: selected,
                    onSelected: (_) => _selectPreset(p),
                    selectedColor: AppColors.primary,
                    backgroundColor: const Color(0xFF1F232C),
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    side: BorderSide.none,
                  ),
                );
              }).toList(),
            ),
          ),

          if (_statusBanner != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusBanner!,
                  style: const TextStyle(
                    color: Color(0xFF34D399),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

          // Interactive Crop Stage
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: _busy
                    ? const CircularProgressIndicator(color: AppColors.primary)
                    : LayoutBuilder(
                        builder: (context, constraints) {
                          final aspect = _rotatedAspect;
                          double stageW = constraints.maxWidth;
                          double stageH = stageW / aspect;
                          if (stageH > constraints.maxHeight) {
                            stageH = constraints.maxHeight;
                            stageW = stageH * aspect;
                          }
                          final stageSize = Size(stageW, stageH);

                          return GestureDetector(
                            onPanStart: (d) => _onPanStart(d.localPosition, stageSize),
                            onPanUpdate: (d) => _onPanUpdate(d.localPosition),
                            onPanEnd: (_) => _onPanEnd(),
                            child: SizedBox(
                              width: stageW,
                              height: stageH,
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  ColorFiltered(
                                    colorFilter: _previewFilter() ??
                                        const ColorFilter.mode(Colors.transparent, BlendMode.dst),
                                    child: RotatedBox(
                                      quarterTurns: _quarterTurns,
                                      child: Image.memory(
                                        widget.imageBytes,
                                        fit: BoxFit.fill,
                                      ),
                                    ),
                                  ),
                                  CustomPaint(
                                    painter: _CropOverlayPainter(_cropNorm),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ),
          ),

          // Bottom Controls Panel
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            decoration: const BoxDecoration(
              color: Color(0xFF181B22),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: _rotateRight90,
                        icon: const Icon(Icons.rotate_right, color: Colors.white),
                        tooltip: 'Rotate 90°',
                      ),
                      Expanded(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: _FilterPreset.values.map((f) {
                              final active = _filter == f;
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: FilterChip(
                                  label: Text(f.label),
                                  selected: active,
                                  onSelected: (_) => setState(() => _filter = f),
                                  selectedColor: const Color(0xFF2563EB),
                                  backgroundColor: const Color(0xFF232732),
                                  checkmarkColor: Colors.white,
                                  labelStyle: TextStyle(
                                    color: active ? Colors.white : Colors.white70,
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  side: BorderSide.none,
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: _resetFull,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white70,
                          side: const BorderSide(color: Colors.white24),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                        child: const Text('Full Photo', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _saving ? null : _saveAndReturn,
                          icon: _saving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.check, size: 18),
                          label: Text(
                            _saving ? 'Saving…' : 'Save & Apply',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CropOverlayPainter extends CustomPainter {
  final Rect normRect;
  _CropOverlayPainter(this.normRect);

  @override
  void paint(Canvas canvas, Size size) {
    final crop = Rect.fromLTWH(
      normRect.left * size.width,
      normRect.top * size.height,
      normRect.width * size.width,
      normRect.height * size.height,
    );

    // Dimmed area outside crop rect
    final dimPaint = Paint()..color = Colors.black.withValues(alpha: 0.56);
    final outer = Path()..addRect(Offset.zero & size);
    final inner = Path()..addRect(crop);
    canvas.drawPath(Path.combine(PathOperation.difference, outer, inner), dimPaint);

    // Rule-of-thirds guides
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.28)
      ..strokeWidth = 0.8;
    for (int i = 1; i <= 2; i++) {
      final gx = crop.left + crop.width * (i / 3.0);
      final gy = crop.top + crop.height * (i / 3.0);
      canvas.drawLine(Offset(gx, crop.top), Offset(gx, crop.bottom), gridPaint);
      canvas.drawLine(Offset(crop.left, gy), Offset(crop.right, gy), gridPaint);
    }

    // Crisp crop border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawRect(crop, borderPaint);

    // 4 Corner handles
    final handleFill = Paint()..color = Colors.white;
    final handleRing = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    for (final pt in [crop.topLeft, crop.topRight, crop.bottomLeft, crop.bottomRight]) {
      canvas.drawCircle(pt, 8.0, handleFill);
      canvas.drawCircle(pt, 8.0, handleRing);
    }
  }

  @override
  bool shouldRepaint(covariant _CropOverlayPainter oldDelegate) {
    return oldDelegate.normRect != normRect;
  }
}
