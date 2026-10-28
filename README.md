# Pixel Vault 🛡️📱

[![Build & Release Android Debug APK](https://github.com/vk4nu/PixelVault/actions/workflows/build-apk.yml/badge.svg)](https://github.com/vk4nu/PixelVault/actions/workflows/build-apk.yml)
[![Direct APK Download](https://img.shields.io/badge/Download-Debug%20APK-brightgreen?logo=android)](https://github.com/vk4nu/PixelVault/releases/latest)

Secure biometric personal vault for Google Pixel devices designed to store Driver's Licences (with reverse side Australian Card Number for DVS verification), Medicare cards, Passports, and Health Insurance credentials with offline zero-knowledge security and automated expiry monitoring.

---

## 📥 Direct APK Download

Whenever code is pushed to this repository, GitHub Actions automatically builds the latest debug APK and publishes it to GitHub Releases:

- **[⬇️ Direct APK Download (PixelVault-debug.apk)](https://github.com/vk4nu/PixelVault/releases/latest/download/PixelVault-debug.apk)**
- **[📦 View All Releases](https://github.com/vk4nu/PixelVault/releases)**
- **[⚡ Actions Build Pipeline](https://github.com/vk4nu/PixelVault/actions/workflows/build-apk.yml)**

---

## 📲 How to Install on Android

1. Download **`PixelVault-debug.apk`** directly to your Android device using the link above.
2. Tap the notification or open your **Files** app and select the downloaded APK.
3. If prompted with *"Install unknown apps"*, tap **Settings** and toggle **Allow from this source**.
4. Tap **Install** and open **Pixel Vault**.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local web development server
npm run dev

# 3. Build web assets and sync to native Android
npm run build
npx cap sync android

# 4. Open in Android Studio (optional)
npx cap open android
```
