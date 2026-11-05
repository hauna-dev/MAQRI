# Pembaruan MAQRI

Repository: https://github.com/hauna-dev/MAQRI

## Rilis pertama

1. Pasang `MAQRI-1.0.10.apk` secara manual pada ponsel. Versi lama belum mempunyai pemeriksa pembaruan ini.
2. Unggah isi ZIP kode sumber ke akar repository, termasuk folder tersembunyi `.github`. Jangan unggah `.signing`, hasil build, SDK, atau folder proyek bot induk.
3. Buat Release publik dengan tag `v1.0.10`. Lampirkan **dua berkas** dari folder output: `MAQRI-1.0.10.apk` dan `update.json`. Publikasikan sebagai rilis terbaru, bukan draft/prerelease. Mengunggah kode saja belum menyediakan pembaruan.

## Versi selanjutnya

Naikkan `android:versionCode` dan `android:versionName` pada `app/src/main/AndroidManifest.xml`, sesuaikan teks versi awal di `app/src/main/assets/index.html`, lalu jalankan:

```powershell
node test_core.cjs
python build.py
python test_updates.py
```

Build menghasilkan APK bertanda tangan serta `output/update.json` yang berisi versi, ukuran, dan SHA-256. Unggah keduanya ke Release baru dengan tag sesuai versi, misalnya `v1.0.11`. Gunakan kunci `.signing/murojaah.jks` yang sama dengan APK sebelumnya. Simpan cadangan kunci dan kata sandinya secara pribadi; ZIP sumber sengaja tidak menyertakannya.

## Build dan rilis otomatis melalui Actions

Workflow lokal tersedia pada `.github/workflows/release.yml`. Workflow ini baru aktif setelah file workflow dan kode sumber terbaru diunggah ke repository GitHub; menyiapkannya di komputer saja belum mengaktifkan Actions.

Pengaturan satu kali di GitHub Settings → Secrets and variables → Actions:

- `ANDROID_KEYSTORE_BASE64`: isi `.signing/murojaah.jks` dikodekan Base64. Gunakan kunci yang sama dengan aplikasi yang sudah terpasang pada pengguna.
- `ANDROID_KEYSTORE_PASSWORD`: kata sandi dari `.signing/password.txt`.

Jangan unggah folder `.signing` ke repository atau lampiran Release. `.gitignore` sudah mengecualikan kunci, output, build, dan SDK lokal. Repository harus publik agar pemeriksa update aplikasi dapat membaca Release tanpa token.

Sesudah konfigurasi satu kali:

1. Selesaikan perubahan aplikasi dan naikkan versionName/versionCode pada manifest.
2. Push kode termasuk perubahan manifest ke branch `main`.
3. Actions menjalankan tes, membangun APK dengan kunci yang disimpan sebagai secret, memverifikasi APK/update.json, lalu menerbitkan Release Latest dengan kedua berkas tersebut.

Tag `vX.Y.Z` yang di-push juga dapat memicu workflow; nama tag harus cocok dengan manifest. Workflow dapat dijalankan manual melalui Actions → Build and publish MAQRI → Run workflow. Versi yang sudah diterbitkan dilewati, sehingga berkas rilis lama tidak ditimpa. Build/publikasi gagal jika secrets belum disetel; workflow tidak membuat kunci pengganti.

## Publikasi langsung dari komputer

`python publish_release.py` hanya memeriksa kecocokan APK, versi, ukuran, SHA-256, ZIP dan konfigurasi updater; tidak menerbitkan apa pun.

Untuk publikasi langsung diperlukan GitHub CLI dan login ke akun yang memiliki izin tulis repository. Setelah kode versi tersebut sudah di-push, jalankan:

```powershell
python publish_release.py --publish --target SHA_COMMIT_VERSI_INI
```

Skrip mengunggah APK dan update.json sebagai satu Release Latest, dan menolak menimpa tag yang sudah dirilis. Simpan identitas pengembang/kunci yang sama agar pengguna dapat memperbarui tanpa kehilangan data.

## Perilaku di ponsel

Pemeriksaan otomatis ketika aplikasi dibuka dibatasi setiap enam jam. Job latar belakang dijadwalkan setiap dua belas jam dengan jaringan tersedia; waktu sebenarnya dapat ditunda Android. Tombol **Periksa sekarang** tersedia di Unduhan.

APK versi lebih baru diunduh otomatis. Aplikasi memeriksa ukuran, SHA-256, nama paket, nomor versi, dan kesamaan tanda tangan APK. Setelah siap, pengguna mengetuk **Pasang pembaruan** dan menyetujui pemasangan di Android. Izin pemasangan dari MAQRI mungkin perlu diaktifkan sekali. Unduhan otomatis dapat memakai kuota seluler.

Tampilan aplikasi tidak menyebut GitHub atau alamat repository. Sumber pembaruan disimpan dalam konfigurasi internal. Repository harus publik; tidak ada token akun yang dibundel.

## Batas verifikasi

Build APK, tanda tangan, kebijakan sumber unduhan, dan kecocokan metadata diuji lokal. Alur unduh–pasang di perangkat Android perlu diuji setelah Release tersedia. Skenario yang disarankan: pasang 1.0.10, terbitkan versi lebih tinggi, periksa pembaruan, tunggu unduhan, lalu pasang tanpa menghapus data aplikasi.

Sebelum publikasi, verify_release_signing.py juga memastikan versionCode lebih tinggi dan sertifikat APK sama dengan rilis sebelumnya. Kunci lokal saat ini telah diperiksa dan cocok dengan APK v1.0.15 yang dipublikasikan. Pemeriksaan ini mencegah rilis otomatis yang tidak dapat memperbarui instalasi pengguna.
