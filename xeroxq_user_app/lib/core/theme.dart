import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFFB432C); // XeroxQ Vibrant Red
  static const Color primaryDark = Color(0xFFD6321F);
  
  // Light Theme Colors
  static const Color backgroundLight = Color(0xFFFDFDFD);
  static const Color cardLight = Colors.white;
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);

  // Dark Theme Colors
  static const Color backgroundDark = Color(0xFF0B0F19);
  static const Color cardDark = Color(0xFF151D30);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color borderDark = Color(0xFF1E293B);

  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);
  static const Color error = Color(0xFFEF4444);
}

/// Gradient presets for bento grid cards — light pastel palette (dark text on top).
class AppGradients {
  // Quick Print hero: soft peach/orange tint
  static const quickPrint = LinearGradient(
    colors: [Color(0xFFFFF0E6), Color(0xFFFFF0E6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  // Vault: soft lavender/blue tint
  static const vault = LinearGradient(
    colors: [Color(0xFFEBF0FF), Color(0xFFEBF0FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  // Shops: soft mint/green tint
  static const shops = LinearGradient(
    colors: [Color(0xFFE6FAF5), Color(0xFFE6FAF5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  // Storage: soft rose/pink tint
  static const storage = LinearGradient(
    colors: [Color(0xFFFFE8EE), Color(0xFFFFE8EE)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  // History: soft sky blue tint
  static const history = LinearGradient(
    colors: [Color(0xFFE6F0FF), Color(0xFFE6F0FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  // Scan: soft green tint
  static const scan = LinearGradient(
    colors: [Color(0xFFE6FFF5), Color(0xFFE6FFF5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  // Accent: soft yellow tint
  static const accent = LinearGradient(
    colors: [Color(0xFFFFF9E6), Color(0xFFFFF9E6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.backgroundLight,
      cardColor: AppColors.cardLight,
      dividerColor: AppColors.borderLight,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: Colors.black,
        surface: AppColors.backgroundLight,
        error: AppColors.error,
      ),
      fontFamily: 'Outfit', // Standard modern font fallback
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.textPrimaryLight),
        titleTextStyle: TextStyle(
          color: AppColors.textPrimaryLight,
          fontSize: 22,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.cardLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.cardLight,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondaryLight,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
        elevation: 10,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.backgroundDark,
      cardColor: AppColors.cardDark,
      dividerColor: AppColors.borderDark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: Colors.white,
        surface: AppColors.backgroundDark,
        error: AppColors.error,
      ),
      fontFamily: 'Outfit',
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.backgroundDark,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.textPrimaryDark),
        titleTextStyle: TextStyle(
          color: AppColors.textPrimaryDark,
          fontSize: 22,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.borderDark, width: 1),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.cardDark,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondaryDark,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
        elevation: 10,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
