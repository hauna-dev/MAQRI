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

Workflow `.github/workflows/release.yml` sudah disiapkan. Pada Settings → Secrets and variables → Actions, tambahkan:

- `ANDROID_KEYSTORE_BASE64`: isi kunci yang sama, dikodekan Base64.
- `ANDROID_KEYSTORE_PASSWORD`: kata sandi dari `.signing/password.txt`.

Untuk menyalin Base64 ke clipboard dari folder proyek di komputer pemilik kunci:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path '.signing/murojaah.jks'))) | Set-Clipboard
```

Tempel hanya ke kolom secret. Jangan masukkan ke kode, issue, atau chat. Setelah kode dan secrets tersedia, push tag versi yang cocok dengan manifest. Workflow membangun, menguji, dan menerbitkan APK beserta update.json. Menjalankan workflow manual hanya menghasilkan artifact unduhan; publikasi Release dilakukan oleh pemicu tag. Jika rilis sudah dibuat manual, jangan memicu ulang tag yang sama.

## Perilaku di ponsel

Pemeriksaan otomatis ketika aplikasi dibuka dibatasi setiap enam jam. Job latar belakang dijadwalkan setiap dua belas jam dengan jaringan tersedia; waktu sebenarnya dapat ditunda Android. Tombol **Periksa sekarang** tersedia di Unduhan.

APK versi lebih baru diunduh otomatis. Aplikasi memeriksa ukuran, SHA-256, nama paket, nomor versi, dan kesamaan tanda tangan APK. Setelah siap, pengguna mengetuk **Pasang pembaruan** dan menyetujui pemasangan di Android. Izin pemasangan dari MAQRI mungkin perlu diaktifkan sekali. Unduhan otomatis dapat memakai kuota seluler.

Tampilan aplikasi tidak menyebut GitHub atau alamat repository. Sumber pembaruan disimpan dalam konfigurasi internal. Repository harus publik; tidak ada token akun yang dibundel.

## Batas verifikasi

Build APK, tanda tangan, kebijakan sumber unduhan, dan kecocokan metadata diuji lokal. Alur unduh–pasang di perangkat Android perlu diuji setelah Release tersedia. Skenario yang disarankan: pasang 1.0.10, terbitkan versi lebih tinggi, periksa pembaruan, tunggu unduhan, lalu pasang tanpa menghapus data aplikasi.
