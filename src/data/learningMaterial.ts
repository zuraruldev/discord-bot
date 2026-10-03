export interface LearningSection {
    title: string;
    content: string;
}

export interface LearningGuide {
    topic: string;
    title: string;
    description: string;
    sections: LearningSection[];
}

export const learningMaterials: Record<string, LearningGuide> = {
    'php-basic': {
        topic: 'php-basic',
        title: 'Materi Belajar: PHP Dasar (Basic)',
        description: 'Panduan persiapan ujian Coding Quiz PHP Basic. Pelajari materi ini agar kamu siap lulus pada percobaan pertama (First Try) dengan skor >= 90% (Grade S).',
        sections: [
            {
                title: '1. Sintaks Dasar & Variabel',
                content:
                    '• Diawali tag `<?php`.\n' +
                    '• Semua variabel wajib diawali tanda dollar (`$`).\n' +
                    '• Case-sensitive untuk nama variabel, tetapi case-insensitive untuk nama fungsi dan class.\n' +
                    '• Operator penggabungan string menggunakan titik (`.`), bukan tanda tambah (`+`).\n' +
                    '• `echo` vs `print`: `print` selalu mengembalikan nilai integer `1` sehingga bisa dipakai dalam ekspresi, sedangkan `echo` tidak mengembalikan nilai.'
            },
            {
                title: '2. Tipe Data, String & Type Juggling',
                content:
                    '• Double quotes (`"..."`) menginterpolasi variabel (misal: `"Halo $nama"`), sedangkan single quotes (`\'...\'`) mencetak teks apa adanya.\n' +
                    '• String concatenation precedence: `echo (3 + 2) . (4 + 1);` menghasilkan `"55"`.\n' +
                    '• Type juggling: `10 + "20 apel"` menghasilkan angka `30` (string dikonversi angka).\n' +
                    '• `empty("0")` menghasilkan `true` (string "0" dianggap falsy pada PHP).'
            },
            {
                title: '3. Operator Perbandingan & Logika',
                content:
                    '• `==` (loose equality): membandingkan nilai setelah type coercion.\n' +
                    '• `===` (strict equality): wajib sama nilai dan sama tipe data.\n' +
                    '• Ternary operator: `$kondisi ? $true : $false`.\n' +
                    '• Elvis operator (`?:`): `$a ?: $b` (jika $a truthy maka $a, selain itu $b).\n' +
                    '• Null coalescing (`??`): `$a ?? $b` (jika $a terdefinisi dan tidak null maka $a, selain itu $b).'
            },
            {
                title: '4. Array & Perulangan',
                content:
                    '• Append elemen baru: `$arr[] = $nilai;`.\n' +
                    '• `count($arr)`: menghitung jumlah elemen di level pertama (non-rekursif).\n' +
                    '• `explode($pemisah, $string)`: memecah string menjadi array.\n' +
                    '• `implode($pemisah, $array)`: menyatukan array menjadi string.\n' +
                    '• `in_array($nilai, $array)`: mengecek keberadaan nilai dalam array.\n' +
                    '• Perulangan `foreach ($array as $key => $val)` untuk iterasi array.\n' +
                    '• `array_merge()` menomori ulang (re-index) kunci numerik dari 0.'
            },
            {
                title: '5. Superglobals & File Inclusion',
                content:
                    '• `$_GET`: data dari URL query parameters.\n' +
                    '• `$_POST`: data dari formulir HTTP POST.\n' +
                    '• `$_SESSION`: data session server; wajib memanggil `session_start()` terlebih dahulu.\n' +
                    '• `require`: memicu fatal error (E_COMPILE_ERROR) dan menghentikan script jika file hilang.\n' +
                    '• `include`: hanya memunculkan E_WARNING jika file tidak ditemukan.'
            },
            {
                title: '6. Function & Parameter Passing',
                content:
                    '• Default parameter dioper by-value.\n' +
                    '• Tambahkan karakter ampersand (`&`) sebelum parameter (contoh: `function ubah(&$var)`) untuk passing by-reference.\n' +
                    '• Gunakan keyword `global` atau array `$GLOBALS` untuk mengakses variabel global di dalam fungsi.'
            }
        ]
    },
    'php-advance': {
        topic: 'php-advance',
        title: 'Materi Belajar: PHP Lanjutan (Advance)',
        description: 'Panduan lengkap fitur PHP modern (PHP 8.0 - 8.3+), OOP tingkat lanjut, keamanan database, dan performa tinggi.',
        sections: [
            {
                title: '1. Fitur Modern PHP 8+',
                content:
                    '• `match` expression: strict equality (`===`), mengembalikan nilai langsung, tidak ada fallthrough, tidak perlu `break`.\n' +
                    '• Nullsafe operator (`?->`): menghentikan rantai evaluasi dan return null jika target null.\n' +
                    '• Constructor Property Promotion: deklarasi property langsung di parameter `__construct(public string $name)`.\n' +
                    '• `declare(strict_types=1);`: mewajibkan type checking ketat untuk parameter dan return value skalar.\n' +
                    '• `readonly` property: hanya bisa diinisialisasi satu kali di dalam class (immutable).\n' +
                    '• Backed Enum: enum dengan nilai skalar (`enum Status: string { case ACTIVE = \'act\'; }`).'
            },
            {
                title: '2. Object-Oriented Programming (OOP) Lanjut',
                content:
                    '• Trait: horizontal code reuse di antara class tanpa hierarki pewarisan.\n' +
                    '• Magic method `__invoke()`: dipanggil saat objek dieksekusi seperti fungsi (`$obj()`).\n' +
                    '• Magic method `__toString()`: dipanggil saat objek dikonversi atau dicetak sebagai string.\n' +
                    '• Late Static Binding (`static::`): merujuk ke class yang dipanggil saat runtime, bukan class tempat deklarasi (`self::`).\n' +
                    '• Keyword `final`: mencegah class diturunkan atau mencegah method di-override oleh child class.\n' +
                    '• Interface `Throwable`: interface tingkat teratas yang diimplementasi oleh `Exception` dan `Error`.'
            },
            {
                title: '3. Generator, Fibers & Return Types Khusus',
                content:
                    '• Keyword `yield`: menghasilkan nilai secara bertahap (lazy evaluation) pada generator function tanpa memakan RAM.\n' +
                    '• Return type `never`: untuk fungsi yang selalu melempar exception atau memanggil `exit()` / `die()` dan tidak pernah return.\n' +
                    '• Fiber (PHP 8.1): coroutine ringan yang dapat di-suspend dan di-resume untuk pemrograman asinkron.\n' +
                    '• WeakMap: menyimpan referensi objek tanpa mencegah Garbage Collector menghapusnya saat tidak digunakan.'
            },
            {
                title: '4. Keamanan & Performa PHP',
                content:
                    '• PDO Prepared Statements: memisahkan SQL structure dari input parameter sehingga kebal terhadap serangan SQL Injection.\n' +
                    '• PSR-4: standar spesifikasi pemetaan namespace class ke folder direktori untuk autoloading composer.\n' +
                    '• Spaceship Operator (`<=>`): mengembalikan `-1` jika kiri < kanan, `0` jika sama, dan `1` jika kiri > kanan.\n' +
                    '• OPcache: menyimpan precompiled script bytecode di shared memory RAM untuk mengeliminasi kompilasi ulang.'
            }
        ]
    },
    'devops': {
        topic: 'devops',
        title: 'Materi Belajar: DevOps & Jaringan Server',
        description: 'Panduan komprehensif IPv4, IPv6, subnetting, SSH, server Linux, Docker, Kubernetes, dan monitoring.',
        sections: [
            {
                title: '1. Pengalamatan IP & Konversi Biner',
                content:
                    '• IPv4: panjang total 32 bit, 4 oktet (masing-masing 8 bit).\n' +
                    '• Konversi Desimal ke Biner 8-bit (bobot: 128, 64, 32, 16, 8, 4, 2, 1):\n' +
                    '  - 192 = 128 + 64 = `11000000`\n' +
                    '  - 168 = 128 + 32 + 8 = `10101000`\n' +
                    '  - 255 = semua bit 1 = `11111111`\n' +
                    '  - 224 = 128 + 64 + 32 = `11100000`\n' +
                    '• Konversi Biner ke Desimal:\n' +
                    '  - 00001010 = 8 + 2 = `10`\n' +
                    '  - 01111111 = 64+32+16+8+4+2+1 = `127`'
            },
            {
                title: '2. Subnetting IPv4 (Usable Hosts)',
                content:
                    '• Rumus usable host: `2^(32 - prefix) - 2` (dikurangi network ID dan broadcast ID).\n' +
                    '  - `/24`: 2^8 - 2 = 256 - 2 = `254` host usable\n' +
                    '  - `/26`: 2^6 - 2 = 64 - 2 = `62` host usable\n' +
                    '  - `/28`: 2^4 - 2 = 16 - 2 = `14` host usable\n' +
                    '  - `/29`: 2^3 = 8 total IP (6 host usable)\n' +
                    '  - `/30`: 2^2 - 2 = `2` host usable (koneksi point-to-point)'
            },
            {
                title: '3. Protokol IPv6 & Port Standar',
                content:
                    '• IPv6: 128 bit, ditulis dalam 8 grup heksadesimal.\n' +
                    '• Alamat loopback IPv6: `::1` (ekuivalen dengan 127.0.0.1 pada IPv4).\n' +
                    '• DNS record IPv4: record `A` | DNS record IPv6: record `AAAA`.\n' +
                    '• Nomor Port Default:\n' +
                    '  - SSH: Port `22` (TCP)\n' +
                    '  - HTTP: Port `80` (TCP)\n' +
                    '  - HTTPS: Port `443` (TCP)\n' +
                    '  - PostgreSQL: Port `5432` (TCP)\n' +
                    '  - MySQL / MariaDB: Port `3306` (TCP)'
            },
            {
                title: '4. SSH & Administrasi Server Linux',
                content:
                    '• Public key tersimpan di `~/.ssh/authorized_keys` pada server.\n' +
                    '• Private key (`id_rsa`) wajib diset izin `chmod 600` (hanya owner read/write).\n' +
                    '• Algoritma kunci modern cepat dan aman: `Ed25519`.\n' +
                    '• Reverse Proxy: Nginx mendistribusikan traffic ke backend service, SSL termination, dan caching.\n' +
                    '• `systemctl daemon-reload`: memuat ulang konfigurasi unit file systemd.\n' +
                    '• `journalctl -u <service> -f`: streaming log service secara realtime.\n' +
                    '• `ss` (Socket Statistics): perintah modern pengganti `netstat`.'
            },
            {
                title: '5. Kontainer & Kubernetes',
                content:
                    '• Docker: instruksi `FROM` wajib mengawali Dockerfile.\n' +
                    '• Docker Volumes: mekanisme persistensi data di luar daur hidup container.\n' +
                    '• Multi-stage build: memisahkan stage build dari stage runtime agar image akhir berukuran minimal.\n' +
                    '• Kubernetes `Pod`: unit komputasi terkecil yang membungkus container.\n' +
                    '• `kubelet`: agen yang berjalan di tiap worker node untuk memastikan container berjalan sehat.\n' +
                    '• `etcd`: database key-value store terdistribusi yang menyimpan status cluster Kubernetes.\n' +
                    '• Prometheus: mengumpulkan metrik menggunakan `pull model` (scrape endpoint HTTP).'
            }
        ]
    },
    'hardware': {
        topic: 'hardware',
        title: 'Materi Belajar: Computer Hardware',
        description: 'Panduan komprehensif arsitektur CPU, media penyimpanan SATA & NVMe, memori RAM, motherboard, dan catu daya.',
        sections: [
            {
                title: '1. Prosesor (CPU) & Arsitektur',
                content:
                    '• ALU (Arithmetic Logic Unit): sirkuit digital yang menjalankan operasi matematika dan logika boolean.\n' +
                    '• Cache CPU (L1, L2, L3): dibuat dari memori SRAM (Static RAM) super cepat tanpa refresh kapasitor.\n' +
                    '• Soket LGA vs PGA:\n' +
                    '  - LGA (Land Grid Array): pin berada di soket motherboard, CPU hanya memiliki pad kontak datar.\n' +
                    '  - PGA (Pin Grid Array): pin berada di bawah prosesor.\n' +
                    '• SMT (Simultaneous Multithreading) / Hyper-Threading: memungkinkan 1 physical core mengeksekusi 2 thread komputasi sekaligus.\n' +
                    '• TDP (Thermal Design Power): daya termal maksimum yang harus dilepaskan oleh sistem pendingin.'
            },
            {
                title: '2. Media Penyimpanan: SATA, NVMe, & RAID',
                content:
                    '• SATA III (Revision 3.0): kecepatan transfer teoritis maksimal `6.0 Gb/s` (~550-600 MB/s nyata), kabel data `7 pin`.\n' +
                    '• SSD NVMe: terhubung langsung melalui lane bus `PCIe` untuk bandwidth tinggi dan latensi rendah.\n' +
                    '• Form Factor M.2 2280: lebar `22 mm` dan panjang `80 mm`.\n' +
                    '• Konfigurasi RAID:\n' +
                    '  - RAID 0 (Striping): performa cepat, tanpa redundansi, toleransi kerusakan `0%` (1 disk rusak = semua data hilang).\n' +
                    '  - RAID 1 (Mirroring): menduplikasi data identik ke drive lain untuk redundansi.\n' +
                    '  - RAID 5: membutuhkan minimal `3 drive`, mendistribusikan data dan parity.'
            },
            {
                title: '3. Memori RAM (Random Access Memory)',
                content:
                    '• Volatile Memory: kehilangan seluruh data seketika saat suplai listrik terputus (DRAM).\n' +
                    '• SO-DIMM: form factor RAM kompak untuk laptop dan mini PC.\n' +
                    '• ECC (Error-Correcting Code): RAM server yang mampu mendeteksi dan mengoreksi error data 1-bit secara otomatis.\n' +
                    '• Dual-Channel: menggandakan lebar bus data memori dari 64-bit menjadi `128-bit`.\n' +
                    '• CAS Latency (CL): jumlah siklus clock antara perintah pembacaan kolom hingga data siap di pin output.'
            },
            {
                title: '4. Motherboard, Power Supply & Cooling',
                content:
                    '• UEFI: standar firmware modern pengganti BIOS lawas (dukung partisi GPT > 2TB & Secure Boot).\n' +
                    '• Baterai CMOS: tipe `CR2032` dengan tegangan output `3 Volt` untuk menjaga daya RTC (Real-Time Clock).\n' +
                    '• VRM (Voltage Regulator Module): sirkuit penurun daya 12V dari PSU menjadi daya voltase presisi rendah (~1.2V) untuk CPU.\n' +
                    '• Form factor Mini-ITX: dimensi fisik `170 x 170 mm`.\n' +
                    '• Sertifikasi 80 PLUS: menjamin efisiensi konversi daya AC ke DC minimal `80%`.\n' +
                    '• Pasta Termal: mengisi rongga udara mikroskopis di antara IHS prosesor dan heatsink pendingin.\n' +
                    '• Thunderbolt 4: bandwidth data maksimal `40 Gbps`.'
            }
        ]
    }
};

export const topicAliases: Record<string, string> = {
    'php': 'php-basic',
    'php-basic': 'php-basic',
    'phpbasic': 'php-basic',
    'php-advance': 'php-advance',
    'php-advanced': 'php-advance',
    'phpadvance': 'php-advance',
    'phpadvanced': 'php-advance',
    'devops': 'devops',
    'dev-ops': 'devops',
    'network': 'devops',
    'hardware': 'hardware',
    'hw': 'hardware',
    'computer': 'hardware',
    'komputer': 'hardware'
};
