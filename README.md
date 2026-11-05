# MAQRI — Mushaf, Audio, dan Al-Qur’an Interaktif

Dikembangkan oleh Hauna.

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

## Tafsir As-Sa’di edisi Indonesia

Di tab **Tafsir**, menu **Tafsir Indonesia** dan **Tafsir Arab** tersedia di atas formulir teks per ayat. Edisi Indonesia menjadi pilihan awal; pilihan bahasa disimpan. Pilih Ayat Kursi, Al-Fatihah, Al-Ikhlas, atau ketik rentang seperti `2:255`, lalu ketuk **Baca tafsir**. Teks Indonesia bersumber dari [Saadi.IslamEnc.com](https://saadi.islamenc.com/id/browse/tafsir/saadi), ditampilkan dari sumber aslinya dengan atribusi dan tautan ke ayat terkait. Audio tafsir tetap berbahasa Arab.

Android mengambil satu halaman surat, memisahkan teks Indonesia dari bagian Arab pembanding, dan menyimpan halaman di folder internal `tafsir-id`. Surat yang telah dibaca tersedia kembali tanpa internet. Penjelasan yang sumbernya menggabungkan beberapa ayat ditampilkan sekali dengan rentang dan keterangan; ayat tanpa penjelasan tersendiri tidak diisi dengan teks ayat lain. Untuk membuka surat lain pertama kali diperlukan internet. Teks Arab dari tafsir.app tetap mempunyai cache terpisah.

Verifikasi: `node tests/tafsir_indonesia.cjs` memeriksa pilihan bahasa, sumber, tampilan dan respons kedaluwarsa. Parser Java diuji dengan halaman Al-Fatihah, Al-Baqarah (286 anchor ayat), dan Al-Ikhlas. Emulator Android 15 berhasil menampilkan Ayat Kursi edisi Indonesia, membukanya kembali dalam mode pesawat, menampilkan satu penjelasan gabungan untuk 2:8–9, dan beralih ke edisi Arab lalu kembali. Preview browser mendukung kedua sumber melalui `preview.py` tanpa modul dari folder induk.

## Audio Tafsir As-Sa’di

Di tab **Tafsir**, pilih surat pada kartu **Audio Tafsir As-Sa’di**, lalu ketuk **Putar audio tafsir**. Tersedia 114 surat berbahasa Arab, pembacaan Abdulrahman Al-Subhan, dari [Way2Quran](https://way2quran.com/id/tafsir/series/saadi-tafsir-subhan-reading). Audio merupakan pembacaan kitab As-Sa’di, bukan rekaman suara beliau sendiri. Daftar sumber/durasi: `app/src/main/assets/tafsir-audio.json`.

Audio diputar streaming langsung melalui HTTPS, tanpa mengunduh seluruh surat terlebih dahulu. Memerlukan internet dan belum disediakan sebagai unduhan offline. Android menggunakan service pemutar/notifikasi yang sama dengan murottal: jeda, lanjut, seek, surat sebelumnya/berikutnya, dan berhenti. Posisi per surat disimpan berkala serta saat jeda/berhenti agar bisa dilanjutkan. Tidak tersedia sinkronisasi atau penanda waktu per ayat; tombol mushaf membuka halaman ayat pertama surat. Teks tafsir per ayat tetap tersedia di bawah kartu audio.

Verifikasi: `node tests/tafsir_audio.cjs`; daftar lengkap 114 URL diperiksa dari halaman sumber, dan permintaan byte-range MP3 surat 1, 2, 114 berhasil (HTTP 206). Emulator Android 15 berhasil memutar Al-Fatihah, jeda/seek, melanjutkan dari sekitar 2:40, berjalan di latar belakang, dan berpindah ke Al-Baqarah lalu kembali. Tidak ada error AndroidRuntime/MediaPlayer pada pengujian ini. APK dibangun dan dipasang kembali di emulator.

## Rekam dan cek hafalan

Pada tab **Murojaah**, pilih surat dan ayat awal/akhir, lalu ketuk **Mulai rekam hafalan**. Izinkan mikrofon saat diminta. Ketuk **Hentikan dan simpan**, lalu **Buka rekaman di Mushaf**. Pada tab Mushaf, pilih rekaman dan ketuk **Putar rekaman** untuk membuka halaman ayat awal sambil mendengarkan. Tersedia jeda/lanjut dan penggeser posisi audio. Pengecekan bacaan dilakukan sendiri dengan mengikuti mushaf.

Rekaman AAC/M4A disimpan di penyimpanan internal aplikasi, terpisah dari audio qari, lengkap dengan surat, rentang ayat, waktu dan durasi. Rekaman tidak diunggah. Tetap buka aplikasi saat merekam; berpindah ke aplikasi lain atau mengunci layar akan menghentikan dan menyimpan rekaman. Layar dijaga menyala selama perekaman, maksimal 30 menit. Menghapus data aplikasi atau mencopotnya menghapus rekaman. Perekaman tersedia di aplikasi Android; gambar mushaf tetap membutuhkan internet.

Verifikasi fitur: `node tests/hafalan.cjs` memeriksa alur rekam/simpan, pemutaran dan seek, halaman ayat awal, pemulihan setelah penolakan izin, serta pencegahan audio bersamaan. Seluruh sumber Java berhasil dikompilasi terhadap Android API 35. Alur native diuji pada emulator Android 15: izin mikrofon ditolak/diizinkan, rekam/simpan, putar/jeda/seek, mushaf, persistensi setelah restart/pembaruan APK, dan simpan otomatis saat Home ditekan. Pemutar dibuat mengambang saat membaca mushaf dan inset status bar Android 15 diperbaiki. Kualitas suara mikrofon fisik masih perlu diuji di HP. Laporan pengujian: output/emulator-qa/RESULTS.md.

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

Pembaruan 1.0.4: nama menjadi MAQRI, singkatan Mushaf, Audio, dan Al-Qur’an Interaktif. Identitas pengembang: Hauna. Ikon memakai simbol buku terbuka. ID paket serta kunci tanda tangan dipertahankan untuk pembaruan instalasi sebelumnya.

Pembaruan 1.0.5: ikon dan beranda memakai logo MAQRI, monogram M dengan buku terbuka dan penanda emas. Master: branding/maqri-logo.png.

Pembaruan 1.0.6: palet mengikuti identitas Ponpes Riyadhussholihiin: teal #166074, teal gelap #0C3C4A, kuning #FAD30D, dan putih. Ikon dan beranda memakai branding/maqri-logo-pondok.png.

Pembaruan 1.0.7: logo huruf mim (م) kuning pada teal gelap. Tampilan diperbarui melalui design.css: header dan ikon berukuran tetap, kartu pembuka lebih ringkas, tipografi lebih terbaca, tombol unduh jelas, dan navigasi konsisten. Aset diberi versi agar tampilan lama tidak tertahan cache. Diperiksa pada lebar 320 dan 412 piksel tanpa overflow horizontal; mushaf halaman 42 dan Tafsir Ayat Kursi tampil di pratinjau.

Pembaruan 1.0.8: memakai logo pilihan pengguna dengan warna pondok. Tema Terang/Gelap/Sistem dapat dipilih pada tab Unduhan, atau gunakan tombol bulan/matahari di kanan atas. Pilihan tema disimpan; status bar, navigation bar, dan warna WebView Android ikut disesuaikan. Gambar mushaf tetap memakai warna asli. Navigasi bawah diberi padding 27px sehingga ikon naik sekitar 14px dan mini-player ikut dinaikkan. Tema, persistensi setelah reload, dan overflow pada lebar 320/412px diuji di pratinjau; build native dan signature APK lolos. Pengujian runtime native pada HP tetap belum dilakukan.

Pembaruan 1.0.9: Al-Minshawi Murattal menjadi qari default. Audio tetap berjalan saat berpindah tab. Pemutar menyediakan Buka mushaf ayat ini (menuju halaman ayat aktif) dan Baca tafsir ayat ini (memuat tafsir ayat aktif). Penanda bintang diganti bullet. Pemetaan halaman lokal bersumber dari https://api.alquran.cloud/v1/meta dan diperiksa pada batas halaman serta Ayat Kursi (2:255 → 42). Pengujian pratinjau menunjukkan audio Al-Minshawi tetap maju saat membuka Mushaf dan Tafsir. Pengujian native pada HP masih diperlukan.

## Pembaruan aplikasi

Konfigurasi pembaruan memakai hauna-dev/MAQRI. APK baru diunduh otomatis dan pemasangan tetap dikonfirmasi melalui Android. Ikuti [panduan rilis](PANDUAN_RILIS.md) untuk menerbitkan APK dan update.json, atau mengaktifkan workflow rilis otomatis. Jalankan `python test_updates.py` untuk memeriksa kebijakan sumber dan kecocokan metadata APK.


## Pembaruan 1.0.13 — kontrol membaca dan rekaman

- Mushaf: tombol layar penuh di toolbar menyembunyikan header, menu bawah, serta system bar Android. Tombol halaman dan zoom gambar tetap tersedia. Keluar dengan tombol × atau Back Android. Pemutar hafalan tetap dapat digunakan di layar penuh.
- Rekaman: pada kartu Cek hafalan sendiri, pilih rekaman lalu Hapus rekaman ini. Dialog Android menyediakan Batal/Hapus. Hanya rekaman yang dipilih yang dihapus; pemutar dihentikan jika rekaman tersebut sedang diputar.
- Tafsir: tombol Sebelumnya/Berikutnya membuka satu ayat sebelum/sesudah rentang yang sedang ditampilkan, termasuk berpindah surat. Untuk penjelasan gabungan Indonesia, navigasi melewati kelompok ayat tersebut. Navigasi berhenti pada awal/akhir Al-Qur’an.
- Font tafsir: A−, A+, dan Reset tersedia pada toolbar yang tetap terlihat saat teks digulir. Ukuran Indonesia (12–27 px) dan Arab (18–40 px) disimpan terpisah.

Versi APK: 1.0.13, versionCode 14. Unggah output/MAQRI-1.0.13.apk dan output/update.json dari build yang sama ke Release v1.0.13. Tetap gunakan kunci penandatanganan yang sama.

Tes tambahan: node tests/reading_controls.cjs; tes rekaman juga mencakup permintaan hapus dan keadaan daftar kosong. Di emulator Android 15 diuji layar penuh/Back, batal dan hapus rekaman uji, navigasi 2:255 → 2:256 → 2:255, serta ukuran teks Indonesia dan Arab.


## Pembaruan 1.0.14 — membaca lebih cepat

Mushaf langsung menampilkan halaman terakhir beserta navigasi/zoom/layar penuh. Pengelolaan rekaman dipindahkan ke panel Rekaman hafalan yang dapat dibuka dari tombol di atas mushaf. Panel bisa ditutup melalui ×, Back, atau ketukan di luar panel. Bila belum ada rekaman, tombol Mulai rekam hafalan membawa pengguna ke perekam Murojaah. Saat memutar rekaman, panel menutup dan pemutar mengambang tetap tersedia sambil membaca.

Tab Tafsir membuka mode Baca, dengan pilihan Indonesia/Arab dan formulir ayat langsung terlihat. Mode Dengar menampilkan pilihan surat dan pemutar audio secara terpisah. Perpindahan mode tidak menghentikan audio yang sedang diputar. Navigasi ayat dan ukuran teks tetap tersedia di mode Baca.

APK: output/MAQRI-1.0.14.apk, versionCode 15. Gunakan update.json dari build yang sama untuk rilis v1.0.14.


## Pembaruan 1.0.15 — Mushaf offline otomatis

Mulai versi ini, setiap halaman mushaf yang berhasil dibuka akan otomatis disimpan ke penyimpanan internal aplikasi, terpisah dari cache HTTP WebView. Setelah penanda Bisa dibaca offline muncul, halaman dapat dibuka tanpa internet, termasuk setelah aplikasi ditutup/dibuka ulang. Halaman yang pernah dibuka di versi sebelumnya perlu dibuka kembali sekali saat online untuk masuk penyimpanan ini.

Tab Unduhan menyediakan kartu Mushaf Offline: jumlah halaman, ukuran penyimpanan, dan pilihan membuka halaman tersimpan. Hanya halaman yang tersimpan yang tersedia offline; belum mengunduh seluruh 604 halaman secara otomatis. Menghapus audio MP3 tidak menghapus mushaf. Menghapus data aplikasi atau mencopotnya menghapus halaman tersimpan.

Sumber gambar tetap edisi Madani Hafs 1441 v1 dari Adhan. Gambar diperiksa sebelum disimpan dan ditulis melalui berkas sementara agar unduhan gagal tidak dianggap tersimpan. Bila ruang penyimpanan penuh, gambar online masih dapat dibaca tetapi status menjelaskan bahwa halaman belum tersimpan. Preview browser tidak menyediakan penyimpanan offline Android ini.

Verifikasi: emulator Android 15 membuka halaman 282 online, lalu mode pesawat diaktifkan, Wi-Fi/data dimatikan, aplikasi dihentikan dan dibuka ulang. Halaman tetap tampil dan tercatat sebagai 1 halaman (~0.2 MB) di daftar offline. Konektivitas dikembalikan setelah pengujian. Tes tambahan: node tests/mushaf_cache.cjs dan Java MushafCachePolicyTest; test_updates.py memverifikasi kecocokan APK/update.json.

Rilis: output/MAQRI-1.0.15.apk dan output/update.json, versionCode 16.


## Pembaruan 1.0.16 — ulang per ayat

Pada tab Murojaah, pilih Ulang per ayat (1, 2, 3, 5, 10, 20 atau 99 kali) sebelum memutar. Setiap ayat diselesaikan sebanyak pilihan tersebut sebelum maju. Contoh ayat 1–3, ulang per ayat 3 kali: 1,1,1 → 2,2,2 → 3,3,3. Ulang rentang tetap terpisah; bila dipilih 3 kali, seluruh urutan tersebut diulang tiga putaran.

Pilihan per ayat disimpan dan dicatat pada rentang terakhir. Pemutar dan notifikasi menampilkan hitungan ulang ayat serta putaran rentang. Tombol ayat berikutnya/sebelumnya memulai ayat tujuan dari pengulangan pertama. Memutar ulang setelah selesai juga mereset hitungan. Fitur bekerja dengan audio online, MP3 tersimpan, dan koleksi bawaan; audio tafsir tetap diputar satu kali per surat.

Tes: node tests/ayah_repeat.cjs memeriksa urutan gabungan, pemutaran ulang, skip manual, dan kompatibilitas 1 kali. Android 15 diuji melalui UI dengan Al-Fatihah ayat 1, ulang per ayat 2 kali; media session teramati berpindah 1/2 → 2/2 pada ayat yang sama tanpa error MediaPlayer/AndroidRuntime. APK 1.0.16 (versionCode 17) ditandatangani dan dipasang di emulator; update.json diverifikasi terhadap berkas APK.


## Pembaruan 1.0.17 — navigasi mushaf dengan usap dan ketuk

Pada gambar mushaf, usap ke kanan atau ketuk 24% area tepi kiri untuk halaman berikutnya. Usap ke kiri atau ketuk tepi kanan untuk halaman sebelumnya, mengikuti arah membaca mushaf. Area tengah tidak membalik halaman. Tombol navigasi tetap tersedia.

Berlaku pada tampilan biasa dan layar penuh. Pada zoom lebih dari 100%, usap/ketuk tidak membalik halaman agar gambar tetap bisa digeser. Kembalikan zoom ke 100% untuk navigasi gerakan. Gulir vertikal, long press, sentuhan dua jari dan klik sintetis setelah sentuhan tidak menyebabkan perpindahan ganda. Batas halaman tetap 1–604. Halaman berikutnya yang belum tersimpan membutuhkan internet seperti sebelumnya.

Tes: node tests/mushaf_gestures.cjs mencakup arah usap/tepi, batas halaman, scroll vertikal, long press, multi-touch, zoom/pan, klik ganda dan keadaan memuat. Emulator Android 15 memverifikasi 282→283 dengan usap kanan dan kembali dengan usap kiri; ketuk tepi kiri/kanan juga berhasil. Rilis: MAQRI-1.0.17.apk, versionCode 18, dengan output/update.json yang sesuai.
