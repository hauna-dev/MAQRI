# MAQRI — Mushaf, Audio, Qur’an Riyadhussholihiin

Dikembangkan oleh Tim IT Ponpes Riyadhussholihiin.

APK: `output/MAQRI-1.0.10.apk`. Membutuhkan Android 8.0 atau lebih baru dan Android System WebView yang aktif. Aplikasi berjalan mandiri di ponsel; komputer serta bot Telegram/WhatsApp tidak diperlukan.

## Cara memasang

1. Kirim APK ke ponsel melalui kabel USB, Drive, atau chat sebagai dokumen.
2. Buka APK pada ponsel lalu ikuti petunjuk instalasi Android. Ini APK pribadi untuk pemasangan langsung, belum diterbitkan di Play Store.
3. Buka MAQRI. Jika ingin kontrol pemutaran tampil sebagai notifikasi, izinkan notifikasi saat diminta.

## Cara menggunakan

- **Murojaah:** pilih surat, ayat awal/akhir, qari, dan pengulangan rentang. Bisa juga mengetik `2:25-30`, `2 25 30`, atau `2:255`. Maksimal 100 ayat per rentang. Audio tiap ayat diputar berurutan; tidak memerlukan FFmpeg atau penggabungan MP3.
- **Offline:** ketuk Unduh untuk didengar offline, lalu biarkan aplikasi terbuka sampai selesai. Audio yang berhasil diputar juga disimpan. Sesudah tersimpan, rentang tersebut bisa diputar tanpa internet dengan qari yang sama. Pilih rentang yang seluruh ayatnya sudah diunduh. Layar Unduhan menunjukkan jumlah ayat per surat/qari serta penggunaan ruang.
- **Mushaf:** masukkan halaman 1–604. Gambar Mushaf Madinah Hafs 1441 H dimuat online; gunakan tombol tambah/kurang untuk zoom. Aplikasi tidak membundel gambar mushaf.
- **Tafsir:** masukkan misalnya `1:1-7` atau `2:255`. Teks Arab As-Sa’di diambil langsung dari tafsir.app. Ayat tanpa teks tersendiri diberi keterangan. Tafsir yang pernah dibuka disimpan lokal untuk mempercepat pembacaan berikutnya.
- **Latar belakang:** pemutar memakai service Android dan notifikasi media. Tombol jeda, ayat sebelumnya/berikutnya, dan hentikan tersedia. Sistem dapat membatasi aplikasi karena penghematan baterai pada sebagian merek ponsel.

## Mengapa APK kecil

Sayahafiz menyediakan daftar murottal yang merujuk ke EveryAyah. Versi yang dibuat memakai Alafasy 64 kbps, Husary 64 kbps, As-Sudais 64 kbps, dan Al-Minshawi Murattal 128 kbps. MP3 diunduh per ayat ke penyimpanan internal aplikasi, bukan seluruh koleksi dimasukkan ke APK. Ukuran penyimpanan bertambah sesuai audio yang dipakai/diunduh. Menghapus data aplikasi atau mencopot aplikasi menghapus unduhan.

Sumber:
- https://sayahafiz.com/Murottal.html
- https://everyayah.com/data/Alafasy_64kbps/
- https://everyayah.com/data/Husary_64kbps/
- https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps/
- Mushaf: https://adhan.trinadhthatakula.com/quran/ (gambar sumber 001–604 pada `/mushaf/madani-hafs-1441-v1/`)
- As-Sa’di: https://tafsir.app/saadi/1/1
- Metadata surat: https://api.alquran.cloud/v1/surah

## Kode dan build

UI lokal: `app/src/main/assets/`. Pemutar, cache MP3, dan jaringan Android: `app/src/main/java/id/murojaah/app/`. Tidak ada token Telegram, data WhatsApp, atau konfigurasi bot di APK.

Build menggunakan JDK 21 dari Eclipse Temurin dan Android SDK platform/build-tools 35, yang diambil dari sumber resmi dan disimpan di tools. Jalankan `python tools/setup.py` jika alat belum tersedia, kemudian `python build.py`, atau klik Build APK.cmd. Tidak memerlukan Gradle atau Android Studio untuk build ini.

Untuk versi besar dengan semua MP3 folder proyek dimasukkan ke aplikasi, jalankan `python build.py --bundle-audio`. Build ini menghasilkan `MAQRI-1.0.10-offline.apk`, dan menu qari menampilkan **Koleksi lokal (bawaan)**. Versi besar tidak dibangun secara default. Aplikasi tetap memiliki sumber qari online; rekaman bawaan menggunakan koleksi MP3 asli proyek Anda.

Simpan folder `.signing` secara pribadi. Kunci tersebut diperlukan supaya versi APK berikutnya bisa memperbarui instalasi yang sama. ZIP kode sumber tidak menyertakan kunci ini. Jangan menghapusnya jika ingin melanjutkan pembaruan aplikasi yang sudah dipasang.

## Verifikasi

- `node test_core.cjs`: memeriksa 114 surat/6236 ayat, format permintaan, rentang invalid, dan pemetaan URL audio/mushaf.
- APK berhasil dikompilasi, di-zipalign, dan diverifikasi tanda tangan v2/v3.
- Tiga sumber qari, mushaf halaman 42, dan endpoint As-Sa’di berhasil diakses.
- UI diuji di pratinjau ukuran ponsel: perpindahan tab, membuka dan memperbesar halaman 42, mengambil Tafsir Ayat Kursi, serta input rentang audio.
- Belum diuji instalasi dan pemutaran native di HP/emulator Android. Verifikasi akhir pada perangkat diperlukan, khususnya pemutaran saat layar mati, notifikasi, dan akses offline.

Preview browser: `python preview.py` lalu buka http://127.0.0.1:18766 . Preview ditujukan untuk pemeriksaan UI; unduhan offline dan notifikasi native tersedia hanya di APK. Preview tafsir menggunakan modul tafsir_saadi.py dari folder proyek induk.

Pembaruan 1.0.1: menambahkan Muhammad Siddiq Al-Minshawi (Murattal 128 kbps), sumber https://everyayah.com/data/Minshawy_Murattal_128kbps/ . Pasang APK baru di atas versi sebelumnya agar unduhan tetap tersimpan.

Pembaruan 1.0.2: nama aplikasi menjadi RIMA (Riyadh Murojaah), dengan identitas Tim IT Ponpes Riyadhussholihiin. ID paket dan kunci penandatanganan tetap sama agar bisa memperbarui instalasi lama tanpa menghapus unduhan.

Pembaruan 1.0.3: logo monogram R dan buku terbuka dipasang pada ikon Android dan beranda. Master logo di branding/rima-logo.png; prompt imagegen di branding/PROMPT.txt.

Pembaruan 1.0.4: nama menjadi MAQRI, singkatan Mushaf, Audio, Qur’an Riyadhussholihiin. Identitas pengembang: Tim IT Ponpes Riyadhussholihiin. Ikon memakai simbol buku terbuka. ID paket serta kunci tanda tangan dipertahankan untuk pembaruan instalasi sebelumnya.

Pembaruan 1.0.5: ikon dan beranda memakai logo MAQRI, monogram M dengan buku terbuka dan penanda emas. Master: branding/maqri-logo.png.

Pembaruan 1.0.6: palet mengikuti identitas Ponpes Riyadhussholihiin: teal #166074, teal gelap #0C3C4A, kuning #FAD30D, dan putih. Ikon dan beranda memakai branding/maqri-logo-pondok.png.

Pembaruan 1.0.7: logo huruf mim (م) kuning pada teal gelap. Tampilan diperbarui melalui design.css: header dan ikon berukuran tetap, kartu pembuka lebih ringkas, tipografi lebih terbaca, tombol unduh jelas, dan navigasi konsisten. Aset diberi versi agar tampilan lama tidak tertahan cache. Diperiksa pada lebar 320 dan 412 piksel tanpa overflow horizontal; mushaf halaman 42 dan Tafsir Ayat Kursi tampil di pratinjau.

Pembaruan 1.0.8: memakai logo pilihan pengguna dengan warna pondok. Tema Terang/Gelap/Sistem dapat dipilih pada tab Unduhan, atau gunakan tombol bulan/matahari di kanan atas. Pilihan tema disimpan; status bar, navigation bar, dan warna WebView Android ikut disesuaikan. Gambar mushaf tetap memakai warna asli. Navigasi bawah diberi padding 27px sehingga ikon naik sekitar 14px dan mini-player ikut dinaikkan. Tema, persistensi setelah reload, dan overflow pada lebar 320/412px diuji di pratinjau; build native dan signature APK lolos. Pengujian runtime native pada HP tetap belum dilakukan.

Pembaruan 1.0.9: Al-Minshawi Murattal menjadi qari default. Audio tetap berjalan saat berpindah tab. Pemutar menyediakan Buka mushaf ayat ini (menuju halaman ayat aktif) dan Baca tafsir ayat ini (memuat tafsir ayat aktif). Penanda bintang diganti bullet. Pemetaan halaman lokal bersumber dari https://api.alquran.cloud/v1/meta dan diperiksa pada batas halaman serta Ayat Kursi (2:255 → 42). Pengujian pratinjau menunjukkan audio Al-Minshawi tetap maju saat membuka Mushaf dan Tafsir. Pengujian native pada HP masih diperlukan.

## Pembaruan aplikasi

Konfigurasi pembaruan memakai hauna-dev/MAQRI. APK baru diunduh otomatis dan pemasangan tetap dikonfirmasi melalui Android. Ikuti [panduan rilis](PANDUAN_RILIS.md) untuk menerbitkan APK dan update.json, atau mengaktifkan workflow rilis otomatis. Jalankan `python test_updates.py` untuk memeriksa kebijakan sumber dan kecocokan metadata APK.
