# JatahIn - Website logging pengeluaran

JatahIn membantu mahasiswa mengatur uang saku. Kamu isi pemasukan, sisihkan pengeluaran wajib, lalu aplikasi menghitung **jatah harian**. Kalau jatah hari itu masih bersisa, kamu dapat koin untuk mendandani beruangmu.

## Cara menjalankan
1. Simpan `index.html`, `script.js`, `style.css`, dan folder `assets/` di satu folder.
2. Buka `index.html` di browser.
3. Klik **Daftar** isi detail, lalu **Masuk** menggunakan password dan email yang didaftarkan.

Data disimpan di browser (`localStorage`), jadi hanya ada di browser dan perangkat itu. Akun di sini hanya untuk demo, jangan pakai password asli.

## Cara hitung jatah
- **Uang bebas** = pemasukan bulan ini − pengeluaran wajib
- **Jatah harian** = uang bebas ÷ jumlah hari dalam bulan
- **Sisa hari ini** = jatah harian − pengeluaran hari ini

Status harian: **Aman** (di bawah 80%), **Hampir habis** (80% ke atas), **Habis** (tepat 100%), **Melewati batas** (lebih dari 100%).

## Fitur

**Akun & Profil**
- Daftar, masuk, dan keluar. Data tiap akun terpisah.
- Ubah nama, email, dan nomor HP di halaman Profil.
- **Foto profil**: unggah JPG/PNG (maks 5 MB). Foto muncul di bar atas, sidebar, dan halaman Profil. **Hapus Foto** untuk menghapusnya.

**Beranda**
- Jatah hari ini, sisa saldo bebas, streak, koin, dan beruangmu.
- Daftar pengeluaran hari ini.
- Tombol cepat: Camilan/Kopi (10rb), Makan Siang (15rb), Makan Lengkap (20rb), Belanja Mingguan (50rb).
- Tagihan bulanan yang belum dibayar, dengan tombol "Tandai dibayar".

**Input Pemasukan**
- Jenis **Bulanan** (uang awal bulan) atau **Tambahan** (uang masuk di tengah bulan).
- Pemasukan tambahan bisa masuk ke **Harian** (jatah dihitung ulang) atau **Tabungan** (disimpan terpisah).
- **Pengeluaran wajib** (kos, paket data, dll.) disisihkan lebih dulu agar tidak terpakai.
- Pratinjau jatah harian langsung terlihat saat mengetik.

**Input Pengeluaran**
- Isi nominal, nama, kategori, dan sumber dana (bank/e-wallet atau tunai).
- Pratinjau dampak ke jatah hari ini sebelum disimpan.

**Simulasi & Cek Beli**
- Masukkan nama dan harga barang untuk melihat dampaknya ke tabungan dan jatah.
- Pilihan: **Tunda Dulu** (masuk daftar tunda), **Tetap Beli & Sesuaikan** (dicatat sebagai pengeluaran), atau **Terapkan** (jatah harian baru berlaku sampai akhir bulan).
- **Kembali ke Autopilot** mengembalikan jatah otomatis.

**Riwayat & Alokasi**
- Tabel transaksi bulan ini dengan pencarian dan filter kategori.
- Hapus transaksi dengan tombol ✕.
- Tandai pengeluaran wajib sudah dibayar atau belum (reset tiap bulan).

**Koin & Streak**

Koin dihitung saat hari berganti:

| Hari berakhir dengan... | Hasil |
|---|---|
| Pengeluaran **di bawah** jatah | +10 koin, streak +1 |
| Pengeluaran **tepat** sebesar jatah | tanpa koin, streak +1 |
| Pengeluaran **melebihi** jatah | tanpa koin, streak jadi 0 |

Koin tidak pernah berkurang karena boros.

**Kustomisasi Beruang** (ikon beruang di bar atas)
- Beri nama beruang (maks 20 huruf).
- Beli hiasan dengan koin: kepala (Bebek, Bunga, Pita, Mahkota), aksesori (Tongkat Sihir, Boneka, Boba, Ikan, Wortel), pakaian (Hoodie hangat, Syal hangat).
- Item yang sudah dimiliki tidak ditagih lagi. Koin yang kurang akan menahan penyimpanan.

**Lompat Hari (simulasi)**
- Tombol **+1 hari** dan **+7 hari** di bar atas untuk mencoba koin dan streak tanpa menunggu.
- Hanya bisa maju. Isi pemasukan dulu. Kalau lompat ke bulan baru, isi pemasukan bulan itu supaya koin dihitung.
- **Reset Data Demo** (menu ⋮ di sidebar) menghapus semua data untuk mulai dari awal.

## Struktur proyek
index.html   tampilan semua halaman
script.js    logika aplikasi
style.css    gaya tampilan
assets/      gambar yang digunakan dalam website

## Batasan
- Data hanya ada di satu browser, tanpa sinkronisasi atau cadangan.
- Tidak ada keamanan login sungguhan, jadi jangan dipakai untuk data keuangan asli.
- Transaksi bisa dihapus tetapi tidak bisa diedit.
- Koin yang sudah dipakai tidak dikembalikan.
