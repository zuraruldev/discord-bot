export type CodingTopic = 'php-basic' | 'php-advance' | 'devops' | 'hardware';
export type QuestionType = 'mc' | 'direct';
export type QuestionDifficulty = 'normal' | 'hard';

export interface CodingQuestion {
    id: string;
    topic: CodingTopic;
    type: QuestionType;
    difficulty: QuestionDifficulty;
    question: string;
    options?: string[];
    answer: string[];
    name: string;
    explanation?: string;
}

export const codingQuestions: CodingQuestion[] = [
    // ==========================================
    // PHP BASIC - PILIHAN GANDA (MC) - NORMAL (10)
    // ==========================================
    {
        id: 'php-b-mc-01',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Karakter apa yang wajib digunakan sebagai awalan setiap penamaan variabel pada PHP?',
        options: ['A) @', 'B) $', 'C) #', 'D) &'],
        answer: ['b', 'b)', '$', 'dollar'],
        name: 'B) $',
        explanation: 'Pada PHP, seluruh variabel wajib diawali dengan tanda dollar ($).'
    },
    {
        id: 'php-b-mc-02',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Operator apa yang digunakan untuk menggabungkan (concatenate) dua buah string pada PHP?',
        options: ['A) +', 'B) .', 'C) &', 'D) ->'],
        answer: ['b', 'b)', '.', 'dot', 'titik'],
        name: 'B) .',
        explanation: 'PHP menggunakan operator titik (.) untuk penggabungan string, sedangkan tanda tambah (+) khusus untuk operasi matematika.'
    },
    {
        id: 'php-b-mc-03',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa perbedaan utama antara perintah echo dan fungsi print pada PHP?',
        options: [
            'A) echo mengembalikan nilai integer, sedangkan print tidak',
            'B) print selalu mengembalikan nilai 1 sehingga dapat dipakai dalam ekspresi, sedangkan echo tidak memiliki nilai kembalian',
            'C) echo jauh lebih lambat dibandingkan print',
            'D) print dapat menerima banyak argumen sekaligus yang dipisahkan koma'
        ],
        answer: ['b', 'b)', 'print return 1', 'print mengembalikan nilai 1'],
        name: 'B) print selalu mengembalikan nilai 1 sehingga dapat dipakai dalam ekspresi, sedangkan echo tidak memiliki nilai kembalian',
        explanation: 'print selalu menghasilkan return value 1 sehingga bisa dipakai dalam ekspresi, sedangkan echo bertindak sebagai language construct tanpa nilai kembalian.'
    },
    {
        id: 'php-b-mc-04',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Superglobal array apa yang menampung data masukan yang dikirim melalui metode HTTP POST?',
        options: ['A) $_GET', 'B) $_POST', 'C) $_SERVER', 'D) $_REQUEST_BODY'],
        answer: ['b', 'b)', '$_post', '$_POST', 'post'],
        name: 'B) $_POST',
        explanation: '$_POST adalah associative array yang berisi variabel yang dikirimkan ke skrip saat ini melalui metode HTTP POST.'
    },
    {
        id: 'php-b-mc-05',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Fungsi bawaan PHP apa yang digunakan untuk menghitung jumlah elemen di dalam array?',
        options: ['A) length()', 'B) size()', 'C) count()', 'D) array_length()'],
        answer: ['c', 'c)', 'count', 'count()'],
        name: 'C) count()',
        explanation: 'count() (atau aliasnya sizeof()) digunakan untuk menghitung jumlah elemen dalam array atau Countable object.'
    },
    {
        id: 'php-b-mc-06',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa yang terjadi jika file yang disertakan menggunakan require() tidak ditemukan di server?',
        options: [
            'A) PHP hanya memunculkan E_NOTICE dan skrip tetap berjalan',
            'B) PHP memunculkan E_WARNING dan skrip tetap melanjutkan eksekusi',
            'C) PHP menghasilkan fatal error (E_COMPILE_ERROR) dan langsung menghentikan eksekusi skrip',
            'D) PHP mengembalikan false secara diam-diam'
        ],
        answer: ['c', 'c)', 'fatal error', 'fatal', 'menghentikan eksekusi'],
        name: 'C) PHP menghasilkan fatal error (E_COMPILE_ERROR) dan langsung menghentikan eksekusi skrip',
        explanation: 'require memicu fatal error dan menghentikan jalannya program jika file tidak ada, berbeda dengan include yang hanya memunculkan warning.'
    },
    {
        id: 'php-b-mc-07',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa perbedaan mendasar antara operator perbandingan == dan === pada PHP?',
        options: [
            'A) == membandingkan tipe data, === hanya membandingkan nilai',
            'B) == membandingkan nilai dengan konversi tipe (type coercion), sedangkan === membandingkan nilai dan tipe data secara identik (strict)',
            'C) === khusus digunakan untuk objek saja',
            'D) == untuk assignment nilai variabel, === untuk perbandingan logika'
        ],
        answer: ['b', 'b)', 'strict', 'strict comparison'],
        name: 'B) == membandingkan nilai dengan konversi tipe (type coercion), sedangkan === membandingkan nilai dan tipe data secara identik (strict)',
        explanation: '== melakukan konversi tipe data otomatis (loose equality), sementara === mewajibkan kedua operand memiliki nilai dan tipe data yang sama persis.'
    },
    {
        id: 'php-b-mc-08',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Jenis tanda kutip apa yang mengevaluasi dan menginterpolasi nilai variabel secara langsung di dalam string?',
        options: ['A) Single quotes (\'...\')', 'B) Double quotes ("...")', 'C) Backticks (`...`)', 'D) Kurung siku ([...])'],
        answer: ['b', 'b)', 'double quotes', 'double quote', '"'],
        name: 'B) Double quotes ("...")',
        explanation: 'String dengan tanda kutip ganda ("...") akan menginterpolasi nilai variabel dan karakter escape khusus.'
    },
    {
        id: 'php-b-mc-09',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Sintaks ringkas apa yang digunakan untuk menambahkan elemen baru $item ke urutan paling akhir dari array $arr?',
        options: ['A) $arr.append($item)', 'B) $arr->push($item)', 'C) $arr[] = $item', 'D) push($arr, $item)'],
        answer: ['c', 'c)', '$arr[] = $item', '$arr[]', '[]'],
        name: 'C) $arr[] = $item',
        explanation: 'Notasi kurung siku kosong $arr[] = $item menyisipkan item baru pada indeks numerik paling akhir dalam array.'
    },
    {
        id: 'php-b-mc-10',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Struktur perulangan apa yang dirancang khusus untuk mengiterasi seluruh elemen array atau objek di PHP?',
        options: ['A) for', 'B) while', 'C) foreach', 'D) do-while'],
        answer: ['c', 'c)', 'foreach', 'foreach loop'],
        name: 'C) foreach',
        explanation: 'foreach menyediakan mekanisme praktis dan aman untuk membaca setiap elemen key-value pada array dan objek traversable.'
    },

    // ==========================================
    // PHP BASIC - PILIHAN GANDA (MC) - HARD (4)
    // ==========================================
    {
        id: 'php-b-mc-h01',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'hard',
        question: 'Bagaimana hasil evaluasi dari fungsi empty("0") pada PHP?',
        options: [
            'A) false, karena string "0" memiliki panjang 1 karakter',
            'B) true, karena string "0" dianggap bernilai falsy menurut aturan konversi tipe data PHP',
            'C) PHP menghasilkan Warning karena input berupa string numerik',
            'D) null'
        ],
        answer: ['b', 'b)', 'true', 'falsy'],
        name: 'B) true, karena string "0" dianggap bernilai falsy menurut aturan konversi tipe data PHP',
        explanation: 'Pada PHP, string "0" secara eksplisit dievaluasi sebagai empty/falsy bersama dengan false, 0, 0.0, "", null, dan array kosong.'
    },
    {
        id: 'php-b-mc-h02',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa perbedaan perilaku antara isset($arr["key"]) dan array_key_exists("key", $arr) jika $arr["key"] bernilai NULL?',
        options: [
            'A) Keduanya sama-sama menghasilkan true',
            'B) isset() menghasilkan true sedangkan array_key_exists() menghasilkan false',
            'C) isset() menghasilkan false sedangkan array_key_exists() menghasilkan true',
            'D) array_key_exists() menghasilkan Fatal Error'
        ],
        answer: ['c', 'c)', 'isset false array_key_exists true'],
        name: 'C) isset() menghasilkan false sedangkan array_key_exists() menghasilkan true',
        explanation: 'isset() memeriksa keberadaan kunci DAN memastikan nilainya bukan null. Sementara array_key_exists() hanya memeriksa keberadaan kunci tanpa mempedulikan nilainya.'
    },
    {
        id: 'php-b-mc-h03',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa yang terjadi pada indeks numerik saat dua buah array digabungkan menggunakan fungsi array_merge()?',
        options: [
            'A) Elemen dengan indeks numerik yang sama akan ditimpa (overwritten)',
            'B) Indeks numerik akan diurutkan ulang (re-indexed) secara berurutan mulai dari 0',
            'C) Indeks numerik diubah menjadi tipe string',
            'D) Terjadi konflik collision error jika ada kunci kembar'
        ],
        answer: ['b', 'b)', 're-indexed', 'diurutkan ulang', 'reindexed'],
        name: 'B) Indeks numerik akan diurutkan ulang (re-indexed) secara berurutan mulai dari 0',
        explanation: 'array_merge() menomori ulang seluruh indeks numerik secara sekuensial dari 0, berbeda dengan operator tanda tambah ($a + $b) yang mempertahankan kunci numerik asli.'
    },
    {
        id: 'php-b-mc-h04',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'hard',
        question: 'Bagaimana cara mendefinisikan konstanta global yang dievaluasi saat waktu compile (compile-time) pada PHP?',
        options: [
            'A) Menggunakan fungsi define()',
            'B) Menggunakan keyword const',
            'C) Menggunakan static $constant',
            'D) Menggunakan readonly $constant'
        ],
        answer: ['b', 'b)', 'const', 'keyword const'],
        name: 'B) Menggunakan keyword const',
        explanation: 'Keyword const dievaluasi pada saat compile-time dan dapat dipakai di class atau namespace, sedangkan define() dievaluasi saat runtime.'
    },

    // ==========================================
    // PHP BASIC - ISIAN SINGKAT (DIRECT) - NORMAL (10)
    // ==========================================
    {
        id: 'php-b-dir-01',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Karakter simbol satu huruf apa yang wajib dituliskan di awal setiap penamaan variabel PHP?',
        answer: ['$', 'dollar', 'tanda dollar'],
        name: '$',
        explanation: 'Seluruh variabel pada PHP diawali dengan simbol dollar ($).'
    },
    {
        id: 'php-b-dir-02',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Operator satu karakter tanda baca apa yang digunakan untuk menggabungkan (concatenate) dua buah string pada PHP?',
        answer: ['.', 'titik', 'dot'],
        name: '.',
        explanation: 'Operator titik (.) dipakai untuk menyambung string pada PHP.'
    },
    {
        id: 'php-b-dir-03',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Fungsi bawaan PHP apa yang digunakan untuk memecah string menjadi array berdasarkan karakter pemisah (delimiter)?',
        answer: ['explode', 'explode()'],
        name: 'explode()',
        explanation: 'explode(delimiter, string) memotong string menjadi array berdasarkan pemisah tertentu.'
    },
    {
        id: 'php-b-dir-04',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Fungsi bawaan PHP apa yang digunakan untuk menggabungkan seluruh elemen array menjadi sebuah string tunggal?',
        answer: ['implode', 'implode()', 'join', 'join()'],
        name: 'implode()',
        explanation: 'implode(separator, array) menyatukan elemen array menjadi string.'
    },
    {
        id: 'php-b-dir-05',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Sebutkan nama array superglobal yang menampung parameter masukan dari URL query string!',
        answer: ['$_GET', '$_get', 'get'],
        name: '$_GET',
        explanation: '$_GET adalah superglobal penampung data parameter URL dari request HTTP GET.'
    },
    {
        id: 'php-b-dir-06',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Fungsi bawaan apa yang wajib dipanggil sebelum membaca atau memodifikasi data pada superglobal $_SESSION?',
        answer: ['session_start', 'session_start()'],
        name: 'session_start()',
        explanation: 'session_start() memulai atau melanjutkan session yang ada pada server.'
    },
    {
        id: 'php-b-dir-07',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nilai angka kembalian (return value) dari fungsi print() pada PHP jika berhasil dieksekusi?',
        answer: ['1', 'satu'],
        name: '1',
        explanation: 'print() pada PHP selalu menghasilkan return value integer 1.'
    },
    {
        id: 'php-b-dir-08',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Apa output yang dihasilkan dari kode PHP berikut: echo (3 + 2) . (4 + 1); ?',
        answer: ['55'],
        name: '55',
        explanation: '(3 + 2) menghasilkan 5, (4 + 1) menghasilkan 5. Keduanya digabung dengan operator string (.) sehingga menjadi "55".'
    },
    {
        id: 'php-b-dir-09',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Fungsi bawaan apa yang digunakan untuk memeriksa apakah suatu nilai (value) terdapat di dalam array?',
        answer: ['in_array', 'in_array()'],
        name: 'in_array()',
        explanation: 'in_array($needle, $haystack) mengembalikan true jika nilai ditemukan di dalam array.'
    },
    {
        id: 'php-b-dir-10',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Operator null coalescing pada PHP dituliskan menggunakan simbol apa?',
        answer: ['??'],
        name: '??',
        explanation: 'Operator null coalescing (??) mengembalikan operand kiri jika ada dan tidak null, atau operand kanan jika sebaliknya.'
    },

    // ==========================================
    // PHP BASIC - ISIAN SINGKAT (DIRECT) - HARD (4)
    // ==========================================
    {
        id: 'php-b-dir-h01',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa hasil integer dari operasi perulangan count([1, [2, 3], 4]) pada PHP?',
        answer: ['3', 'tiga'],
        name: '3',
        explanation: 'Secara default count() bersifat non-rekursif (COUNT_NORMAL), sehingga hanya menghitung elemen di level pertama: 1, [2, 3], dan 4 (total 3 elemen).'
    },
    {
        id: 'php-b-dir-h02',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa hasil angka dari operasi penjumlahan PHP berikut: echo 10 + "20 apel"; ?',
        answer: ['30'],
        name: '30',
        explanation: 'PHP melakukan type juggling pada string leading-numeric ("20 apel" dikonversi menjadi integer 20), sehingga 10 + 20 = 30.'
    },
    {
        id: 'php-b-dir-h03',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'hard',
        question: 'Karakter simbol satu huruf apa yang digunakan di depan parameter fungsi agar argumen dilewatkan sebagai referensi (by reference)?',
        answer: ['&', 'ampersand'],
        name: '&',
        explanation: 'Tanda ampersand (&) sebelum nama parameter menunjukkan bahwa argumen dipassing by reference sehingga modifikasi di dalam fungsi mempengaruhi variabel luar.'
    },
    {
        id: 'php-b-dir-h04',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa hasil desimal dari operasi bitwise AND berikut pada PHP: echo (12 & 9); ?',
        answer: ['8'],
        name: '8',
        explanation: '12 dalam biner adalah 1100, 9 adalah 1001. Hasil bitwise AND (1100 & 1001) adalah 1000 dalam biner, yang setara dengan angka desimal 8.'
    },

    // ==========================================
    // PHP ADVANCE - PILIHAN GANDA (MC) - NORMAL (10)
    // ==========================================
    {
        id: 'php-a-mc-01',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Bagaimana match expression pada PHP 8 berbeda dari statement switch tradisional?',
        options: [
            'A) match menggunakan loose equality (==), sedangkan switch menggunakan strict (===)',
            'B) match menggunakan perbandingan tipe data yang ketat (===), menghasilkan return value, dan tidak memerlukan keyword break',
            'C) match hanya bisa mengevaluasi bilangan bulat (integer)',
            'D) match tidak mendukung banyak kondisi dalam satu baris arm'
        ],
        answer: ['b', 'b)', 'strict ===', 'strict'],
        name: 'B) match menggunakan perbandingan tipe data yang ketat (===), menghasilkan return value, dan tidak memerlukan keyword break',
        explanation: 'match expression membandingkan nilai secara strict (===), mengembalikan nilai langsung, dan mengeksekusi cabang yang cocok tanpa fallthrough.'
    },
    {
        id: 'php-a-mc-02',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Operator apa yang diperkenalkan pada PHP 8 untuk memanggil method atau property berantai tanpa memicu error jika null?',
        options: ['A) ??', 'B) ?->', 'C) ?.', 'D) &->'],
        answer: ['b', 'b)', '?->', 'nullsafe'],
        name: 'B) ?->',
        explanation: 'Nullsafe operator (?->) langsung menghentikan rantai evaluasi dan mengembalikan null jika salah satu elemen bernilai null.'
    },
    {
        id: 'php-a-mc-03',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Fitur PHP 8 apa yang memungkinkan pendeklarasian sekaligus inisialisasi property class langsung di parameter __construct?',
        options: [
            'A) Constructor Property Promotion',
            'B) Dynamic Property Binding',
            'C) Auto Wiring Properties',
            'D) Inline Field Declaration'
        ],
        answer: ['a', 'a)', 'constructor property promotion', 'property promotion'],
        name: 'A) Constructor Property Promotion',
        explanation: 'Constructor Property Promotion memungkinkan visibility modifier (public, protected, private) ditaruh pada argumen konstruktor untuk otomatis membuat property.'
    },
    {
        id: 'php-a-mc-04',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Directive baris pertama apa yang wajib ditambahkan di paling atas file untuk menerapkan pemeriksaan tipe data skalar secara ketat?',
        options: ['A) use strict;', 'B) declare(strict_types=1);', 'C) ini_set("strict_mode", 1);', 'D) #pragma strict'],
        answer: ['b', 'b)', 'declare(strict_types=1);', 'declare(strict_types=1)'],
        name: 'B) declare(strict_types=1);',
        explanation: 'declare(strict_types=1); mewajibkan parameter dan return type sesuai dengan deklarasi tipe tanpa type coercion otomatis.'
    },
    {
        id: 'php-a-mc-05',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa tujuan arsitektural utama dari penggunaan Trait pada PHP?',
        options: [
            'A) Menggantikan peran abstract base class',
            'B) Memungkinkan penggunaan ulang kode (horizontal code reuse) di antara hierarki class yang berbeda',
            'C) Mengenkripsi source code kelas PHP',
            'D) Memaksa class mengimplementasikan method tanpa kode program'
        ],
        answer: ['b', 'b)', 'horizontal code reuse', 'reuse kode'],
        name: 'B) Memungkinkan penggunaan ulang kode (horizontal code reuse) di antara hierarki class yang berbeda',
        explanation: 'Trait memungkinkan developer membagikan sekumpulan method di beberapa class independen tanpa batasan single inheritance.'
    },
    {
        id: 'php-a-mc-06',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Mengapa penggunaan Prepared Statements pada PDO sangat diwajibkan untuk keamanan database?',
        options: [
            'A) Mengompresi teks query SQL saat melewati jaringan',
            'B) Memisahkan struktur instruksi query SQL dari data parameter sehingga mencegah serangan SQL Injection',
            'C) Mengatur replikasi database secara otomatis',
            'D) Mempercepat proses otentikasi login pengguna database'
        ],
        answer: ['b', 'b)', 'mencegah sql injection', 'sql injection'],
        name: 'B) Memisahkan struktur instruksi query SQL dari data parameter sehingga mencegah serangan SQL Injection',
        explanation: 'Prepared statement mengirimkan struktur query terpisah dari nilai parameter, sehingga karakter berbahaya masukan pengguna tidak dapat memodifikasi logika SQL.'
    },
    {
        id: 'php-a-mc-07',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Standar rekomendasi apa yang mengatur spesifikasi pemetaan namespace class ke struktur direktori untuk autoloading?',
        options: ['A) PSR-1', 'B) PSR-4', 'C) PSR-7', 'D) PSR-12'],
        answer: ['b', 'b)', 'psr-4', 'psr4', 'b'],
        name: 'B) PSR-4',
        explanation: 'PSR-4 adalah spesifikasi standar PHP-FIG untuk memuat file class secara otomatis (autoloading) berdasarkan prefix namespace.'
    },
    {
        id: 'php-a-mc-08',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa batasan yang diberlakukan keyword readonly pada property class di PHP 8.1+?',
        options: [
            'A) Property tidak dapat diakses di luar class',
            'B) Property hanya dapat diinisialisasi satu kali dan nilainya tidak dapat diubah lagi setelahnya',
            'C) Property disimpan secara terenkripsi di memori',
            'D) Property hanya dapat menampung tipe data integer'
        ],
        answer: ['b', 'b)', 'hanya diinisialisasi satu kali', 'immutable'],
        name: 'B) Property hanya dapat diinisialisasi satu kali dan nilainya tidak dapat diubah lagi setelahnya',
        explanation: 'Property readonly bersifat immutable setelah diinisialisasi di scope class (umumnya di dalam konstruktor).'
    },
    {
        id: 'php-a-mc-09',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa efek dari penambahan keyword final pada sebuah method class di PHP?',
        options: [
            'A) Mencegah child class meng-override method tersebut',
            'B) Menghapus method dari memori setelah pemanggilan pertama',
            'C) Menjadikan method bersifat static',
            'D) Menyembunyikan method dari reflection API'
        ],
        answer: ['a', 'a)', 'mencegah override', 'mencegah override method'],
        name: 'A) Mencegah child class meng-override method tersebut',
        explanation: 'Keyword final mencegah method ditimpa (overridden) oleh subclass manapun.'
    },
    {
        id: 'php-a-mc-10',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Bagaimana cara OPcache meningkatkan performa dan throughput aplikasi PHP?',
        options: [
            'A) Mengompresi respons HTTP keluar menggunakan gzip',
            'B) Menyimpan bytecode hasil kompilasi skrip di shared memory RAM untuk menghindari kompilasi ulang pada setiap request',
            'C) Meng-cache query SQL secara otomatis di Redis',
            'D) Mengubah kode PHP langsung menjadi instruksi biner assembly x86 secara permanen'
        ],
        answer: ['b', 'b)', 'bytecode di shared memory', 'opcache bytecode'],
        name: 'B) Menyimpan bytecode hasil kompilasi skrip di shared memory RAM untuk menghindari kompilasi ulang pada setiap request',
        explanation: 'OPcache menyimpan opcode (bytecode) yang sudah dikompilasi di RAM bersama (shared memory), mengeliminasi overhead parsing pada request berikutnya.'
    },

    // ==========================================
    // PHP ADVANCE - PILIHAN GANDA (MC) - HARD (4)
    // ==========================================
    {
        id: 'php-a-mc-h01',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'hard',
        question: 'Pada arsitektur Late Static Binding, apa perbedaan pemanggilan self::class dengan static::class di dalam child class?',
        options: [
            'A) self::class selalu merujuk ke class tempat method didefinisikan, sedangkan static::class merujuk ke class yang dipanggil saat runtime',
            'B) static::class hanya bisa digunakan untuk abstract method',
            'C) self::class menghasilkan error jika dipanggil secara statis',
            'D) Keduanya selalu menghasilkan nama class yang sama persis dalam segala kondisi'
        ],
        answer: ['a', 'a)', 'self class definisi static class runtime'],
        name: 'A) self::class selalu merujuk ke class tempat method didefinisikan, sedangkan static::class merujuk ke class yang dipanggil saat runtime',
        explanation: 'Late Static Binding (static::) menyelesaikan referensi berdasarkan class pemanggil di runtime, bukan class tempat deklarasi method (self::).'
    },
    {
        id: 'php-a-mc-h02',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa fungsi dari struktur data WeakMap yang diperkenalkan pada PHP 7.4 / 8.0?',
        options: [
            'A) Menyimpan data cache sementara yang hilang setelah 60 detik',
            'B) Menampung key berupa objek tanpa mencegah Garbage Collector menghapus objek tersebut saat tidak ada referensi lain',
            'C) Mempercepat serialisasi data JSON berukuran gigabyte',
            'D) Menghubungkan class dengan tabel database'
        ],
        answer: ['b', 'b)', 'garbage collector objek', 'weakmap'],
        name: 'B) Menampung key berupa objek tanpa mencegah Garbage Collector menghapus objek tersebut saat tidak ada referensi lain',
        explanation: 'WeakMap memegang referensi lemah ke objek kunci. Jika objek dihancurkan di tempat lain, entri di WeakMap otomatis terhapus tanpa memory leak.'
    },
    {
        id: 'php-a-mc-h03',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa fungsi fitur Fiber yang diperkenalkan pada PHP 8.1?',
        options: [
            'A) Melakukan multithreading sejati berbasis hardware kernel CPU',
            'B) Menyediakan coroutine yang dapat diinterupsi dan dilanjutkan secara manual untuk asynchronous dan non-blocking I/O',
            'C) Mengompresi memory heap PHP hingga 50%',
            'D) Mempercepat koneksi kabel fiber optic server'
        ],
        answer: ['b', 'b)', 'coroutine async non blocking', 'fiber'],
        name: 'B) Menyediakan coroutine yang dapat diinterupsi dan dilanjutkan secara manual untuk asynchronous dan non-blocking I/O',
        explanation: 'Fiber adalah blok kode (coroutine) yang dapat dijeda (suspend) dan dilanjutkan (resume) secara mandiri untuk pemrograman asinkron.'
    },
    {
        id: 'php-a-mc-h04',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'hard',
        question: 'Di PHP 8.1+, apa yang membedakan Backed Enum dengan Pure Enum?',
        options: [
            'A) Pure Enum dapat memiliki method, Backed Enum tidak',
            'B) Backed Enum mewajibkan setiap case memiliki nilai skalar bawaan (int atau string) melalui syntax: enum Suit: string',
            'C) Backed Enum disimpan di database MySQL',
            'D) Pure Enum tidak mendukung interface'
        ],
        answer: ['b', 'b)', 'nilai skalar int atau string', 'backed enum'],
        name: 'B) Backed Enum mewajibkan setiap case memiliki nilai skalar bawaan (int atau string) melalui syntax: enum Suit: string',
        explanation: 'Backed Enum memiliki representasi nilai skalar internal (string atau int) untuk setiap case, sedangkan Pure Enum hanya berupa instance case tanpa nilai skalar.'
    },

    // ==========================================
    // PHP ADVANCE - ISIAN SINGKAT (DIRECT) - NORMAL (10)
    // ==========================================
    {
        id: 'php-a-dir-01',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Operator dua karakter apa yang diperkenalkan pada PHP 8 untuk nullsafe method chaining tanpa menimbulkan error jika null?',
        answer: ['?->'],
        name: '?->',
        explanation: 'Nullsafe operator (?->) digunakan untuk memanggil property atau method secara berantai dengan aman jika target bernilai null.'
    },
    {
        id: 'php-a-dir-02',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Sebutkan nama magic method yang otomatis dipanggil saat sebuah instance objek dieksekusi secara langsung seperti fungsi ($obj())!',
        answer: ['__invoke', '__invoke()'],
        name: '__invoke()',
        explanation: '__invoke() dipanggil ketika script mencoba memanggil objek seolah-olah sebagai fungsi.'
    },
    {
        id: 'php-a-dir-03',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Sebutkan nama magic method yang menentukan representasi teks dari suatu objek saat objek tersebut dicetak menggunakan echo!',
        answer: ['__toString', '__tostring', '__toString()', '__tostring()'],
        name: '__toString()',
        explanation: '__toString() menentukan bagaimana objek bereaksi saat dikonversi atau dicetak sebagai string.'
    },
    {
        id: 'php-a-dir-04',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Sebutkan nama interface tingkat teratas di PHP yang menjadi induk dari kelas Exception dan Error!',
        answer: ['Throwable', 'interface throwable'],
        name: 'Throwable',
        explanation: 'Throwable adalah interface dasar untuk semua objek yang dapat dilempar melalui statement throw.'
    },
    {
        id: 'php-a-dir-05',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Keyword apa yang digunakan pada generator function untuk memancarkan (yield) nilai secara berurutan tanpa memuat semua item ke memori?',
        answer: ['yield', 'keyword yield'],
        name: 'yield',
        explanation: 'yield menghentikan sementara fungsi generator dan mengirimkan nilai ke pemanggil secara on-demand.'
    },
    {
        id: 'php-a-dir-06',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Keyword apa yang ditambahkan pada deklarasi method class agar method tersebut tidak dapat di-override oleh class turunannya?',
        answer: ['final', 'keyword final'],
        name: 'final',
        explanation: 'final mencegah method ditimpa (overridden) oleh subclass.'
    },
    {
        id: 'php-a-dir-07',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Sebutkan standar rekomendasi PSR yang mengatur pemetaan namespace class ke struktur direktori untuk autoloading!',
        answer: ['PSR-4', 'PSR4', 'psr-4', 'psr4'],
        name: 'PSR-4',
        explanation: 'PSR-4 mendefinisikan standar pemetaan namespace class ke path file direktori untuk sistem autoloading composer.'
    },
    {
        id: 'php-a-dir-08',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nilai angka hasil dari ekspresi spaceship operator berikut: echo (5 <=> 8); ?',
        answer: ['-1'],
        name: '-1',
        explanation: 'Spaceship operator ($a <=> $b) menghasilkan -1 jika $a lebih kecil dari $b.'
    },
    {
        id: 'php-a-dir-09',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nilai angka hasil dari ekspresi spaceship operator berikut: echo (10 <=> 10); ?',
        answer: ['0', 'nol'],
        name: '0',
        explanation: 'Spaceship operator ($a <=> $b) menghasilkan 0 jika kedua operand bernilai sama.'
    },
    {
        id: 'php-a-dir-10',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nilai angka hasil dari ekspresi spaceship operator berikut: echo (15 <=> 7); ?',
        answer: ['1', 'satu'],
        name: '1',
        explanation: 'Spaceship operator ($a <=> $b) menghasilkan 1 jika operand kiri lebih besar dari operand kanan.'
    },

    // ==========================================
    // PHP ADVANCE - ISIAN SINGKAT (DIRECT) - HARD (4)
    // ==========================================
    {
        id: 'php-a-dir-h01',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'hard',
        question: 'Keyword apa yang digunakan bersama operator scope resolution (::) untuk mengimplementasikan Late Static Binding pada PHP?',
        answer: ['static', 'static::'],
        name: 'static',
        explanation: 'static:: memungkinkan resolusi pemanggilan method mengacu pada class yang aktif saat runtime, bukan class tempat deklarasi.'
    },
    {
        id: 'php-a-dir-h02',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'hard',
        question: 'Sebutkan nama tipe return khusus di PHP 8.1+ untuk fungsi yang dipastikan tidak pernah mengembalikan nilai (selalu exit atau melempar exception)!',
        answer: ['never'],
        name: 'never',
        explanation: 'Tipe return never menandakan bahwa fungsi tidak akan pernah mengembalikan kontrol ke pemanggilnya (selalu exit(), die(), atau throw).'
    },
    {
        id: 'php-a-dir-h03',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'hard',
        question: 'Sintaks keyword apa yang digunakan pada PHP 7.4+ untuk mendefinisikan short arrow function (misal: fn($x) => $x * 2)?',
        answer: ['fn'],
        name: 'fn',
        explanation: 'fn() => ... adalah sintaks arrow functions yang otomatis menangkap variabel dari scope luar by-value.'
    },
    {
        id: 'php-a-dir-h04',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'hard',
        question: 'Interface bawaan PHP apa yang wajib diimplementasikan sebuah class agar objeknya dapat langsung dihitung menggunakan fungsi count()?',
        answer: ['Countable', 'interface countable'],
        name: 'Countable',
        explanation: 'Class yang mengimplementasikan interface Countable wajib mendefinisikan method count() untuk digunakan oleh fungsi global count().'
    },

    // ==========================================
    // DEVOPS - PILIHAN GANDA (MC) - NORMAL (10)
    // ==========================================
    {
        id: 'dev-mc-01',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Berapa bit panjang total dari satu alamat protokol IPv4?',
        options: ['A) 16 bits', 'B) 32 bits', 'C) 64 bits', 'D) 128 bits'],
        answer: ['b', 'b)', '32', '32 bits', '32 bit'],
        name: 'B) 32 bits',
        explanation: 'Alamat IPv4 memiliki panjang 32 bit yang terbagi menjadi 4 oktet (masing-masing 8 bit).'
    },
    {
        id: 'dev-mc-02',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Berapa bit panjang total dari satu alamat protokol IPv6?',
        options: ['A) 32 bits', 'B) 64 bits', 'C) 128 bits', 'D) 256 bits'],
        answer: ['c', 'c)', '128', '128 bits', '128 bit'],
        name: 'C) 128 bits',
        explanation: 'Alamat IPv6 berukuran 128 bit yang ditulis dalam 8 grup heksadesimal.'
    },
    {
        id: 'dev-mc-03',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Berapa nomor port default TCP yang digunakan oleh protokol SSH (Secure Shell)?',
        options: ['A) 21', 'B) 22', 'C) 23', 'D) 80'],
        answer: ['b', 'b)', '22', 'port 22'],
        name: 'B) 22',
        explanation: 'SSH menggunakan port TCP 22 secara default untuk remote terminal terenkripsi.'
    },
    {
        id: 'dev-mc-04',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'File apa di direktori pengguna Linux server yang menyimpan daftar public key SSH client yang diizinkan untuk login?',
        options: ['A) ~/.ssh/id_rsa', 'B) ~/.ssh/authorized_keys', 'C) ~/.ssh/known_hosts', 'D) ~/.ssh/config'],
        answer: ['b', 'b)', 'authorized_keys', '~/.ssh/authorized_keys'],
        name: 'B) ~/.ssh/authorized_keys',
        explanation: '~/.ssh/authorized_keys berisi kumpulan public key yang diberikan izin otentikasi login tanpa password.'
    },
    {
        id: 'dev-mc-05',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Mode izin file (file permission) oktal apa yang wajib diterapkan pada private key SSH (id_rsa) untuk mencegah peringatan keamanan?',
        options: ['A) 777', 'B) 755', 'C) 600', 'D) 644'],
        answer: ['c', 'c)', '600', 'chmod 600'],
        name: 'C) 600',
        explanation: 'SSH mewajibkan private key hanya dapat dibaca dan ditulis oleh pemiliknya sendiri (chmod 600).'
    },
    {
        id: 'dev-mc-06',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa sebutan untuk server yang menerima request lalu meneruskan dan mendistribusikannya ke beberapa server aplikasi backend?',
        options: ['A) Forward Proxy', 'B) Reverse Proxy', 'C) Inverted Gateway', 'D) NAT Switch'],
        answer: ['b', 'b)', 'reverse proxy'],
        name: 'B) Reverse Proxy',
        explanation: 'Reverse proxy (seperti Nginx) berada di depan server internal untuk menangani SSL termination, caching, dan load balancing.'
    },
    {
        id: 'dev-mc-07',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Perintah systemd apa yang wajib dijalankan untuk memuat ulang konfigurasi setelah membuat atau mengedit file .service?',
        options: ['A) systemctl refresh', 'B) systemctl restart systemd', 'C) systemctl daemon-reload', 'D) systemctl reload-all'],
        answer: ['c', 'c)', 'systemctl daemon-reload', 'daemon-reload'],
        name: 'C) systemctl daemon-reload',
        explanation: 'systemctl daemon-reload menginstruksikan systemd untuk membaca ulang unit file dari disk.'
    },
    {
        id: 'dev-mc-08',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Perintah CLI apa yang digunakan untuk memantau stream log unit service systemd bernama nginx secara langsung (realtime follow)?',
        options: ['A) logcat -u nginx', 'B) journalctl -u nginx -f', 'C) systemctl logs nginx', 'D) tail -f /sys/log/nginx'],
        answer: ['b', 'b)', 'journalctl -u nginx -f', 'journalctl'],
        name: 'B) journalctl -u nginx -f',
        explanation: 'journalctl -u nginx -f menampilkan log service nginx dan opsi -f (follow) akan terus memantau entri baru.'
    },
    {
        id: 'dev-mc-09',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Instruksi baris pertama apa yang wajib ada di Dockerfile untuk menentukan parent base image yang digunakan?',
        options: ['A) BASE', 'B) SOURCE', 'C) FROM', 'D) INIT'],
        answer: ['c', 'c)', 'from', 'FROM'],
        name: 'C) FROM',
        explanation: 'FROM menentukan base image awal dari container yang dibangun.'
    },
    {
        id: 'dev-mc-10',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Unit terkecil komputasi yang dapat dideploy dan dikelola di dalam cluster Kubernetes disebut?',
        options: ['A) Container', 'B) Pod', 'C) Deployment', 'D) Node'],
        answer: ['b', 'b)', 'pod', 'pods'],
        name: 'B) Pod',
        explanation: 'Pod adalah unit deployable terkecil dalam Kubernetes yang membungkus satu atau beberapa container.'
    },

    // ==========================================
    // DEVOPS - PILIHAN GANDA (MC) - HARD (4)
    // ==========================================
    {
        id: 'dev-mc-h01',
        topic: 'devops',
        type: 'mc',
        difficulty: 'hard',
        question: 'Komponen Kubernetes apa yang bertindak sebagai database key-value store terdistribusi untuk menyimpan seluruh state cluster?',
        options: ['A) kube-apiserver', 'B) etcd', 'C) kube-scheduler', 'D) CoreDNS'],
        answer: ['b', 'b)', 'etcd'],
        name: 'B) etcd',
        explanation: 'etcd adalah distributed key-value store yang andal dan konsisten yang menyimpan konfigurasi dan status seluruh cluster Kubernetes.'
    },
    {
        id: 'dev-mc-h02',
        topic: 'devops',
        type: 'mc',
        difficulty: 'hard',
        question: 'Model pengumpulan metrik apa yang digunakan oleh Prometheus untuk mengumpulkan metrik dari target server/aplikasi?',
        options: [
            'A) Pull model (Prometheus secara berkala men-scrape HTTP endpoint dari target)',
            'B) Push model (target mengirim UDP packet terus menerus ke Prometheus)',
            'C) Syslog forwarding streaming',
            'D) Message Broker Queue Polling'
        ],
        answer: ['a', 'a)', 'pull model', 'pull'],
        name: 'A) Pull model (Prometheus secara berkala men-scrape HTTP endpoint dari target)',
        explanation: 'Prometheus menggunakan pull model, di mana server secara aktif melakukan HTTP scrape ke endpoint /metrics milik target.'
    },
    {
        id: 'dev-mc-h03',
        topic: 'devops',
        type: 'mc',
        difficulty: 'hard',
        question: 'Dalam konfigurasi Dockerfile, apa tujuan utama dari teknik Multi-Stage Build?',
        options: [
            'A) Menjalankan banyak container sekaligus dalam satu daemon',
            'B) Memisahkan stage build/kompilasi dari stage runtime akhir agar image produksi berukuran seminimal mungkin tanpa tool kompilasi',
            'C) Mengaktifkan load balancing otomatis',
            'D) Menghubungkan Docker langsung dengan cluster Kubernetes'
        ],
        answer: ['b', 'b)', 'memisahkan stage build runtime', 'multi stage build'],
        name: 'B) Memisahkan stage build/kompilasi dari stage runtime akhir agar image produksi berukuran seminimal mungkin tanpa tool kompilasi',
        explanation: 'Multi-stage build menyalin artefak hasil kompilasi dari stage builder ke image runtime yang bersih dan kecil.'
    },
    {
        id: 'dev-mc-h04',
        topic: 'devops',
        type: 'mc',
        difficulty: 'hard',
        question: 'Manakah rentang blok alamat IP berikut yang didefinisikan dalam RFC 1918 sebagai private address space untuk Kelas B?',
        options: ['A) 10.0.0.0/8', 'B) 172.16.0.0/12', 'C) 192.168.0.0/16', 'D) 100.64.0.0/10'],
        answer: ['b', 'b)', '172.16.0.0/12', '172.16'],
        name: 'B) 172.16.0.0/12',
        explanation: 'RFC 1918 mendefinisikan 172.16.0.0/12 (172.16.0.0 hingga 172.31.255.255) sebagai private IPv4 space Kelas B.'
    },

    // ==========================================
    // DEVOPS - ISIAN SINGKAT (DIRECT) - NORMAL (10)
    // ==========================================
    {
        id: 'dev-dir-01',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Konversikan oktet desimal 192 ke dalam format biner 8-bit!',
        answer: ['11000000'],
        name: '11000000',
        explanation: '192 = 128 + 64 = 11000000 dalam biner 8-bit.'
    },
    {
        id: 'dev-dir-02',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Konversikan oktet desimal 168 ke dalam format biner 8-bit!',
        answer: ['10101000'],
        name: '10101000',
        explanation: '168 = 128 + 32 + 8 = 10101000 dalam biner 8-bit.'
    },
    {
        id: 'dev-dir-03',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Konversikan oktet desimal 255 ke dalam format biner 8-bit!',
        answer: ['11111111'],
        name: '11111111',
        explanation: '255 = 128+64+32+16+8+4+2+1 = 11111111 (semua 8 bit bernilai 1).'
    },
    {
        id: 'dev-dir-04',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Konversikan bilangan biner 8-bit 00001010 ke dalam bilangan desimal!',
        answer: ['10', 'sepuluh'],
        name: '10',
        explanation: '00001010 = 8 + 2 = 10 desimal.'
    },
    {
        id: 'dev-dir-05',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Konversikan bilangan biner 8-bit 01111111 ke dalam bilangan desimal!',
        answer: ['127'],
        name: '127',
        explanation: '01111111 = 64 + 32 + 16 + 8 + 4 + 2 + 1 = 127 desimal (oktet pertama loopback address 127.0.0.1).'
    },
    {
        id: 'dev-dir-06',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nomor port default TCP yang digunakan untuk koneksi web HTTPS yang terenkripsi SSL/TLS?',
        answer: ['443', 'port 443'],
        name: '443',
        explanation: 'HTTPS terenkripsi beroperasi pada port standar TCP 443.'
    },
    {
        id: 'dev-dir-07',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa jumlah host IP usable yang dapat digunakan pada subnet IPv4 berukuran /24?',
        answer: ['254'],
        name: '254',
        explanation: 'Subnet /24 memiliki 256 total IP (2^8). Dikurangi network address (.0) dan broadcast address (.255), tersisa 254 usable host.'
    },
    {
        id: 'dev-dir-08',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa jumlah host IP usable yang dapat digunakan pada subnet IPv4 berukuran /26?',
        answer: ['62'],
        name: '62',
        explanation: 'Subnet /26 memiliki 2^(32-26) = 2^6 = 64 total IP. Dikurangi 2 untuk network dan broadcast = 62 usable host.'
    },
    {
        id: 'dev-dir-09',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Tuliskan alamat IP loopback lokal pada protokol IPv6!',
        answer: ['::1', '0:0:0:0:0:0:0:1'],
        name: '::1',
        explanation: 'Alamat loopback pada IPv6 direpresentasikan secara ringkas sebagai ::1.'
    },
    {
        id: 'dev-dir-10',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Perintah CLI dua huruf apa dari paket iproute2 di Linux modern yang menggantikan utilitas netstat?',
        answer: ['ss', 'ss command'],
        name: 'ss',
        explanation: 'ss (Socket Statistics) membaca langsung dari tabel socket kernel Linux sehingga jauh lebih cepat dibanding netstat.'
    },

    // ==========================================
    // DEVOPS - ISIAN SINGKAT (DIRECT) - HARD (4)
    // ==========================================
    {
        id: 'dev-dir-h01',
        topic: 'devops',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa jumlah host IP usable yang dapat digunakan pada subnet IPv4 berukuran /28?',
        answer: ['14'],
        name: '14',
        explanation: 'Subnet /28 memiliki 2^(32-28) = 2^4 = 16 total IP. Dikurangi 2 = 14 usable host IP.'
    },
    {
        id: 'dev-dir-h02',
        topic: 'devops',
        type: 'direct',
        difficulty: 'hard',
        question: 'Konversikan oktet desimal netmask 224 ke dalam format biner 8-bit!',
        answer: ['11100000'],
        name: '11100000',
        explanation: '224 = 128 + 64 + 32 = 11100000 dalam biner 8-bit.'
    },
    {
        id: 'dev-dir-h03',
        topic: 'devops',
        type: 'direct',
        difficulty: 'hard',
        question: 'Apa tipe DNS record yang digunakan secara spesifik untuk memetakan domain ke alamat IPv6?',
        answer: ['AAAA', 'aaaa', 'quad a'],
        name: 'AAAA',
        explanation: 'DNS record tipe A memetakan ke alamat IPv4 (32-bit), sedangkan record AAAA memetakan ke alamat IPv6 (128-bit).'
    },
    {
        id: 'dev-dir-h04',
        topic: 'devops',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa nomor port default TCP yang digunakan oleh sistem basis data PostgreSQL?',
        answer: ['5432', 'port 5432'],
        name: '5432',
        explanation: 'Database PostgreSQL secara default mendengarkan koneksi pada port TCP 5432.'
    },

    // ==========================================
    // HARDWARE - PILIHAN GANDA (MC) - NORMAL (10)
    // ==========================================
    {
        id: 'hw-mc-01',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa kepanjangan dari komponen ALU di dalam prosesor (CPU)?',
        options: [
            'A) Asynchronous Logic Unit',
            'B) Arithmetic Logic Unit',
            'C) Advanced Linear Unit',
            'D) Array Loading Utility'
        ],
        answer: ['b', 'b)', 'arithmetic logic unit', 'alu'],
        name: 'B) Arithmetic Logic Unit',
        explanation: 'ALU (Arithmetic Logic Unit) adalah sirkuit digital yang menjalankan operasi matematika dan logika boolean di dalam prosesor.'
    },
    {
        id: 'hw-mc-02',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Berapa kecepatan transfer teoritis maksimal dari antarmuka antarmuka SATA Revision 3.0 (SATA III)?',
        options: ['A) 1.5 Gb/s', 'B) 3.0 Gb/s', 'C) 6.0 Gb/s', 'D) 12.0 Gb/s'],
        answer: ['c', 'c)', '6 gb/s', '6.0 gb/s', '6gbps'],
        name: 'C) 6.0 Gb/s',
        explanation: 'SATA III memiliki kecepatan transfer teoritis 6.0 Gb/s, atau throughput nyata sekitar 550-600 MB/s.'
    },
    {
        id: 'hw-mc-03',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Jenis memori ultrafast apa yang digunakan untuk membangun cache CPU (L1, L2, L3)?',
        options: ['A) Dynamic RAM (DRAM)', 'B) Static RAM (SRAM)', 'C) NAND Flash', 'D) Magnetic Core'],
        answer: ['b', 'b)', 'sram', 'static ram'],
        name: 'B) Static RAM (SRAM)',
        explanation: 'Cache CPU menggunakan SRAM yang tidak memerlukan penyegaran (refresh) kapasitor berkala sehingga kecepatannya sangat tinggi.'
    },
    {
        id: 'hw-mc-04',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Melalui bus berkecepatan tinggi apa storage SSD NVMe berkomunikasi langsung dengan prosesor (CPU)?',
        options: ['A) SATA', 'B) USB 2.0', 'C) PCIe (PCI Express)', 'D) IDE / PATA'],
        answer: ['c', 'c)', 'pcie', 'pci express'],
        name: 'C) PCIe (PCI Express)',
        explanation: 'NVMe memanfaatkan lane bus PCIe secara langsung untuk bandwidth tinggi dan latensi sangat rendah.'
    },
    {
        id: 'hw-mc-05',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Mengapa memori RAM sistem dikategorikan sebagai memori yang bersifat volatile?',
        options: [
            'A) Komponen fisiknya mudah panas',
            'B) Seluruh data yang tersimpan akan langsung lenyap saat pasokan daya listrik terputus',
            'C) Hanya dapat ditulisi satu kali saja',
            'D) Bekerja dengan radiasi medan magnet'
        ],
        answer: ['b', 'b)', 'data hilang saat listrik padam', 'volatile'],
        name: 'B) Seluruh data yang tersimpan akan langsung lenyap saat pasokan daya listrik terputus',
        explanation: 'Memori volatile membutuhkan aliran listrik kontinu untuk mempertahankan data bit di dalam sel kapasitor.'
    },
    {
        id: 'hw-mc-06',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Pada spesifikasi form factor M.2 2280 untuk SSD, arti dari angka 2280 adalah?',
        options: [
            'A) Lebar 22nm dan kapasitas 80GB',
            'B) Lebar 22 milimeter dan panjang 80 milimeter',
            'C) Kecepatan 2200 MB/s dan suhu maks 80 derajat Celcius',
            'D) 22 pin emas dan tinggi 80 milimeter'
        ],
        answer: ['b', 'b)', '22mm lebar 80mm panjang', '22mm x 80mm'],
        name: 'B) Lebar 22 milimeter dan panjang 80 milimeter',
        explanation: 'Penamaan form factor M.2 mengacu pada dimensi fisik: dua digit pertama (22) adalah lebar mm, dan dua/tiga digit berikutnya (80) adalah panjang mm.'
    },
    {
        id: 'hw-mc-07',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Standar firmware motherboard modern apa yang menggantikan peran legacy BIOS dengan dukungan partisi disk GPT dan Secure Boot?',
        options: ['A) CMOS', 'B) POST', 'C) UEFI', 'D) ACPI'],
        answer: ['c', 'c)', 'uefi'],
        name: 'C) UEFI',
        explanation: 'UEFI (Unified Extensible Firmware Interface) adalah standar firmware modern pengganti BIOS 16-bit lawas.'
    },
    {
        id: 'hw-mc-08',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa perbedaan soket CPU tipe LGA (Land Grid Array) dibanding PGA (Pin Grid Array)?',
        options: [
            'A) Pin-pin kontak terletak di soket motherboard, sedangkan prosesor hanya memiliki bantalan kontak emas datar',
            'B) Pin-pin kontak menancap di prosesor dan motherboard hanya memiliki lubang soket',
            'C) Prosesor disolder mati secara permanen pada papan sirkuit motherboard',
            'D) Menggunakan soket magnetik nirkabel'
        ],
        answer: ['a', 'a)', 'pin di motherboard', 'lga'],
        name: 'A) Pin-pin kontak terletak di soket motherboard, sedangkan prosesor hanya memiliki bantalan kontak emas datar',
        explanation: 'Pada soket LGA, jarum pin sensitif berada di dudukan motherboard, meminimalkan risiko pin prosesor bengkok.'
    },
    {
        id: 'hw-mc-09',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa dampak yang terjadi jika salah satu drive penyimpanan mengalami kerusakan pada konfigurasi RAID 0 (Striping)?',
        options: [
            'A) Sistem tetap berjalan normal tanpa kehilangan data',
            'B) Seluruh data di semua drive hilang total karena data dipecah tanpa adanya parity',
            'C) Data yang hilang otomatis dibangun kembali ke hot-spare drive',
            'D) Hanya data pada drive yang rusak yang hilang, sisanya tetap utuh'
        ],
        answer: ['b', 'b)', 'seluruh data hilang', 'total data loss'],
        name: 'B) Seluruh data di semua drive hilang total karena data dipecah tanpa adanya parity',
        explanation: 'RAID 0 tidak memiliki redundansi atau toleransi kesalahan; jika satu disk rusak, seluruh volume data hancur.'
    },
    {
        id: 'hw-mc-10',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Apa peran utama dari penerapan pasta termal (thermal paste) di antara IHS CPU dan heatsink pendingin?',
        options: [
            'A) Mengelem pendingin agar tidak bergeser',
            'B) Mengisi celah udara mikroskopis di permukaan logam agar transfer panas berlangsung maksimal',
            'C) Mengalirkan arus listrik ground ke pendingin',
            'D) Melumasi kipas prosesor'
        ],
        answer: ['b', 'b)', 'mengisi celah udara', 'transfer panas'],
        name: 'B) Mengisi celah udara mikroskopis di permukaan logam agar transfer panas berlangsung maksimal',
        explanation: 'Udara adalah isolator termal yang buruk. Pasta termal mengisi rongga mikroskopis antara logam pendingin dan IHS untuk konduksi panas optimal.'
    },

    // ==========================================
    // HARDWARE - PILIHAN GANDA (MC) - HARD (4)
    // ==========================================
    {
        id: 'hw-mc-h01',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa peran utama sirkuit VRM (Voltage Regulator Module) pada motherboard komputer?',
        options: [
            'A) Mengonversi sinyal analog audio menjadi digital',
            'B) Menurunkan tegangan 12V dari PSU menjadi tegangan presisi rendah (~1.1V - 1.4V) yang stabil untuk kebutuhan komputasi CPU',
            'C) Mengontrol putaran kipas casing',
            'D) Menyimpan firmware UEFI di ROM'
        ],
        answer: ['b', 'b)', 'menurunkan tegangan 12v untuk cpu', 'vrm'],
        name: 'B) Menurunkan tegangan 12V dari PSU menjadi tegangan presisi rendah (~1.1V - 1.4V) yang stabil untuk kebutuhan komputasi CPU',
        explanation: 'VRM terdiri dari MOSFET, chokes, dan kapasitor yang mengubah daya 12V DC dari catu daya menjadi voltase presisi rendah dengan arus tinggi untuk core CPU.'
    },
    {
        id: 'hw-mc-h02',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'hard',
        question: 'Berapa lebar bus data memori yang aktif saat prosesor menjalankan RAM dalam mode Dual-Channel?',
        options: ['A) 32-bit', 'B) 64-bit', 'C) 128-bit', 'D) 256-bit'],
        answer: ['c', 'c)', '128-bit', '128 bit'],
        name: 'C) 128-bit',
        explanation: 'Single-channel memiliki lebar bus data 64-bit. Dual-channel menggabungkan dua channel 64-bit sehingga memperlebar jalur transfer data menjadi 128-bit.'
    },
    {
        id: 'hw-mc-h03',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa arti nilai CAS Latency (CL) pada spesifikasi modul memori RAM DDR?',
        options: [
            'A) Konsumsi daya maksimum dalam satuan Watt',
            'B) Jumlah clock cycle yang dibutuhkan antara instruksi pembacaan kolom dikirim hingga data tersedia di pin output',
            'C) Kecepatan transfer per detik',
            'D) Suhu kerja maksimal RAM'
        ],
        answer: ['b', 'b)', 'jumlah clock cycle pembacaan kolom', 'cas latency'],
        name: 'B) Jumlah clock cycle yang dibutuhkan antara instruksi pembacaan kolom dikirim hingga data tersedia di pin output',
        explanation: 'CAS Latency (Column Address Strobe) mengukur delay dalam satuan siklus clock antara controller meminta kolom data hingga data tersebut siap disalurkan.'
    },
    {
        id: 'hw-mc-h04',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'hard',
        question: 'Sertifikasi efisiensi daya 80 PLUS pada PSU menyatakan bahwa catu daya mampu mencapai efisiensi energi minimal berapa pada beban kerja normal?',
        options: ['A) 50%', 'B) 70%', 'C) 80%', 'D) 95%'],
        answer: ['c', 'c)', '80%', '80'],
        name: 'C) 80%',
        explanation: 'Sertifikasi 80 PLUS menjamin efisiensi konversi daya listrik AC ke DC setidaknya 80% pada beban beban 20%, 50%, dan 100%.'
    },

    // ==========================================
    // HARDWARE - ISIAN SINGKAT (DIRECT) - NORMAL (10)
    // ==========================================
    {
        id: 'hw-dir-01',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Komponen di dalam CPU yang bertugas mengeksekusi operasi aritmatika dan logika adalah (tuliskan singkatannya 3 huruf)?',
        answer: ['ALU', 'alu'],
        name: 'ALU',
        explanation: 'ALU singkatan dari Arithmetic Logic Unit.'
    },
    {
        id: 'hw-dir-02',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa kecepatan transfer teoritis maksimal dari antarmuka SATA Revision 3.0 (SATA III) dalam satuan Gb/s?',
        answer: ['6', '6.0', '6 Gb/s', '6Gbps'],
        name: '6 Gb/s',
        explanation: 'SATA 3.0 mentransfer data dengan bandwidth teoritis 6.0 Gb/s.'
    },
    {
        id: 'hw-dir-03',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Tipe baterai koin 3V apa yang digunakan pada motherboard untuk menyuplai daya ke RTC dan CMOS saat komputer mati?',
        answer: ['CR2032', 'cr2032', 'CR-2032'],
        name: 'CR2032',
        explanation: 'Baterai lithium CR2032 menjaga pengaturan waktu (RTC) dan setting CMOS motherboard.'
    },
    {
        id: 'hw-dir-04',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Form factor RAM berukuran ringkas yang digunakan pada laptop dan mini PC adalah (tulis singkatannya)?',
        answer: ['SO-DIMM', 'sodimm', 'so-dimm', 'SODIMM'],
        name: 'SO-DIMM',
        explanation: 'SO-DIMM singkatan dari Small Outline Dual In-line Memory Module.'
    },
    {
        id: 'hw-dir-05',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa jumlah pin data pada konektor kabel internal data SATA standar?',
        answer: ['7', '7 pin'],
        name: '7',
        explanation: 'Kabel data SATA memiliki 7 pin konduktor, sedangkan kabel power SATA memiliki 15 pin.'
    },
    {
        id: 'hw-dir-06',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Pada SSD M.2 2280, angka 80 adalah panjang dalam milimeter. Berapa lebarnya dalam satuan milimeter?',
        answer: ['22', '22mm', '22 mm'],
        name: '22 mm',
        explanation: 'M.2 2280 memiliki dimensi fisik lebar 22mm dan panjang 80mm.'
    },
    {
        id: 'hw-dir-07',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa persentase toleransi kegagalan disk pada RAID 0 sebelum seluruh data rusak dan hilang? (tulis angka 0)',
        answer: ['0', '0%'],
        name: '0%',
        explanation: 'RAID 0 tidak memiliki redundansi, toleransi kegagalan disknya adalah 0%.'
    },
    {
        id: 'hw-dir-08',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Singkatan dari apakah istilah TDP dalam spesifikasi pendingin dan konsumsi termal prosesor?',
        answer: ['Thermal Design Power', 'thermal design power'],
        name: 'Thermal Design Power',
        explanation: 'TDP singkatan dari Thermal Design Power.'
    },
    {
        id: 'hw-dir-09',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa bandwidth maksimal teoritis dari antarmuka kabel Thunderbolt 4 dalam satuan Gbps?',
        answer: ['40', '40 Gbps', '40gbps'],
        name: '40 Gbps',
        explanation: 'Thunderbolt 4 memiliki bandwidth bidirectional maksimal 40 Gbps.'
    },
    {
        id: 'hw-dir-10',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Teknologi RAM server yang mampu mendeteksi dan mengoreksi error data 1-bit secara otomatis adalah (tulis singkatannya)?',
        answer: ['ECC', 'ecc'],
        name: 'ECC',
        explanation: 'ECC (Error-Correcting Code) RAM mencegah data corruption pada server mission-critical.'
    },

    // ==========================================
    // HARDWARE - ISIAN SINGKAT (DIRECT) - HARD (4)
    // ==========================================
    {
        id: 'hw-dir-h01',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa dimensi ukuran panjang dan lebar fisik motherboard standar Mini-ITX dalam milimeter? (contoh format: 170x170)',
        answer: ['170x170', '170 x 170', '170mm x 170mm'],
        name: '170 x 170 mm',
        explanation: 'Motherboard Mini-ITX memiliki dimensi presisi 170 x 170 mm (6.7 x 6.7 inci).'
    },
    {
        id: 'hw-dir-h02',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa jumlah minimum drive penyimpanan yang dibutuhkan untuk membangun konfigurasi array RAID 5?',
        answer: ['3', '3 drive', 'tiga'],
        name: '3 drive',
        explanation: 'RAID 5 membutuhkan minimal 3 disk untuk mendistribusikan blok data dan blok parity.'
    },
    {
        id: 'hw-dir-h03',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'hard',
        question: 'Sebutkan singkatan sirkuit pengatur tegangan daya pada motherboard yang menurunkan voltase 12V menjadi daya presisi CPU!',
        answer: ['VRM', 'vrm'],
        name: 'VRM',
        explanation: 'VRM (Voltage Regulator Module) mengatur voltase presisi untuk daya prosesor.'
    },
    {
        id: 'hw-dir-h04',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa volt tegangan nominal dari baterai koin motherboard tipe CR2032? (tulis angka saja)',
        answer: ['3', '3V', '3 volt'],
        name: '3 Volt',
        explanation: 'Baterai lithium koin CR2032 memiliki tegangan output nominal 3 Volt.'
    },

    // ==========================================
    // PHP BASIC - TAMBAHAN (8)
    // ==========================================
    {
        id: 'php-b-mc-11',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Operator apa yang digunakan untuk menghitung sisa hasil pembagian (modulus) pada PHP?',
        options: ['A) /', 'B) %', 'C) //', 'D) mod'],
        answer: ['b', 'b)', '%', 'modulus', 'persen'],
        name: 'B) %',
        explanation: 'Operator persen (%) adalah operator modulus untuk mencari sisa bagi dua bilangan bulat.'
    },
    {
        id: 'php-b-mc-12',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'normal',
        question: 'Fungsi bawaan PHP apa yang digunakan untuk mengubah semua huruf dalam string menjadi huruf kecil (lowercase)?',
        options: ['A) toLower()', 'B) strtolower()', 'C) lower()', 'D) str_lower()'],
        answer: ['b', 'b)', 'strtolower', 'strtolower()'],
        name: 'B) strtolower()',
        explanation: 'strtolower($str) mengubah semua karakter alfabet dalam string menjadi lowercase.'
    },
    {
        id: 'php-b-mc-h05',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa perbedaan utama fungsi array_slice() dan array_splice() pada PHP?',
        options: [
            'A) array_slice memodifikasi array asli secara langsung, array_splice tidak',
            'B) array_slice mengekstrak potongan array tanpa mengubah array asli, sedangkan array_splice menghapus/mengganti elemen dan memodifikasi array asli',
            'C) array_splice hanya berlaku untuk string',
            'D) array_slice mengembalikan boolean'
        ],
        answer: ['b', 'b)', 'array_slice ekstrak tanpa ubah asli array_splice modifikasi'],
        name: 'B) array_slice mengekstrak potongan array tanpa mengubah array asli, sedangkan array_splice menghapus/mengganti elemen dan memodifikasi array asli',
        explanation: 'array_slice() bersifat non-destruktif, sedangkan array_splice() memodifikasi langsung array yang dioper.'
    },
    {
        id: 'php-b-mc-h06',
        topic: 'php-basic',
        type: 'mc',
        difficulty: 'hard',
        question: 'Berapa nilai keluaran dari fungsi strcmp("abc", "abd") pada PHP?',
        options: ['A) 0', 'B) 1', 'C) -1', 'D) false'],
        answer: ['c', 'c)', '-1'],
        name: 'C) -1',
        explanation: 'strcmp menghasilkan integer negatif (< 0, umumnya -1) jika string pertama secara leksikografis lebih kecil dari string kedua.'
    },
    {
        id: 'php-b-dir-11',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Fungsi bawaan PHP apa yang digunakan untuk mencari posisi indeks pertama suatu substring di dalam string?',
        answer: ['strpos', 'strpos()'],
        name: 'strpos()',
        explanation: 'strpos($haystack, $needle) mengembalikan indeks posisi numerik pertama kemunculan substring.'
    },
    {
        id: 'php-b-dir-12',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa hasil angka dari operasi sisa bagi berikut pada PHP: echo (17 % 5); ?',
        answer: ['2', 'dua'],
        name: '2',
        explanation: '17 dibagi 5 adalah 3 dengan sisa 2 (3 x 5 = 15, 17 - 15 = 2).'
    },
    {
        id: 'php-b-dir-h05',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa hasil integer dari: echo (int) ((0.1 + 0.7) * 10); ? (perhatikan kelemahan presisi floating-point)',
        answer: ['7', 'tujuh'],
        name: '7',
        explanation: 'Karena representasi biner floating-point, (0.1 + 0.7) bernilai sekitar 0.7999999999999999. Dikalikan 10 menjadi 7.999999999999999, yang saat di-cast ke (int) dipotong (truncate) menjadi 7.'
    },
    {
        id: 'php-b-dir-h06',
        topic: 'php-basic',
        type: 'direct',
        difficulty: 'hard',
        question: 'Fungsi bawaan PHP apa yang digunakan untuk mengubah huruf pertama setiap kata dalam string menjadi huruf kapital?',
        answer: ['ucwords', 'ucwords()'],
        name: 'ucwords()',
        explanation: 'ucwords($string) mengonversi huruf awal pada tiap kata menjadi uppercase.'
    },

    // ==========================================
    // PHP ADVANCE - TAMBAHAN (8)
    // ==========================================
    {
        id: 'php-a-mc-11',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Sintaks First-class Callable Syntax apa yang diperkenalkan di PHP 8.1 untuk merujuk fungsi atau method sebagai closure?',
        options: ['A) fn() => strlen()', 'B) strlen(...)', 'C) &strlen', 'D) @strlen'],
        answer: ['b', 'b)', 'strlen(...)', '...'],
        name: 'B) strlen(...)',
        explanation: 'PHP 8.1 memperkenalkan First-class Callable Syntax menggunakan titik tiga (misal: strlen(...)) untuk membuat closure dari callable.'
    },
    {
        id: 'php-a-mc-12',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'normal',
        question: 'Sintaks tanda pembuka apa yang digunakan untuk mendeklarasikan Attributes (metadata terstruktur) pada PHP 8+?',
        options: ['A) @Attribute', 'B) #[Attribute]', 'C) /* @Attribute */', 'D) <:Attribute:>'],
        answer: ['b', 'b)', '#[attribute]', '#[]', '#'],
        name: 'B) #[Attribute]',
        explanation: 'Attributes di PHP 8 ditulis menggunakan sintaks kurung siku berpagar #[NamaAttribute].'
    },
    {
        id: 'php-a-mc-h05',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'hard',
        question: 'Apa fungsi dari keyword "yield from" pada generator function di PHP 7+?',
        options: [
            'A) Menghentikan eksekusi generator secara paksa',
            'B) Mendelegasikan pemancaran nilai dari generator lain, array, atau Traversable object',
            'C) Mengonversi generator menjadi array otomatis',
            'D) Menghitung total iterasi generator'
        ],
        answer: ['b', 'b)', 'delegasi generator traversable', 'mendelegasikan'],
        name: 'B) Mendelegasikan pemancaran nilai dari generator lain, array, atau Traversable object',
        explanation: 'yield from memungkinkan generator mendelegasikan proses iterasi ke generator atau array lain (generator delegation).'
    },
    {
        id: 'php-a-mc-h06',
        topic: 'php-advance',
        type: 'mc',
        difficulty: 'hard',
        question: 'Pada PDO, apa mode pengambilan data (fetch mode) default yang mengembalikan array asosiatif dengan nama kolom sebagai key?',
        options: ['A) PDO::FETCH_NUM', 'B) PDO::FETCH_ASSOC', 'C) PDO::FETCH_BOTH', 'D) PDO::FETCH_OBJ'],
        answer: ['b', 'b)', 'pdo::fetch_assoc', 'fetch_assoc'],
        name: 'B) PDO::FETCH_ASSOC',
        explanation: 'PDO::FETCH_ASSOC mengembalikan baris record dalam bentuk associative array yang diindeks oleh nama kolom tabel.'
    },
    {
        id: 'php-a-dir-11',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Keyword apa yang digunakan pada class untuk mewarisi (inheritance) sifat dan method dari class induk (parent class)?',
        answer: ['extends', 'keyword extends'],
        name: 'extends',
        explanation: 'Keyword extends digunakan pada deklarasi class turunan untuk mewarisi parent class.'
    },
    {
        id: 'php-a-dir-12',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'normal',
        question: 'Keyword apa yang digunakan pada class untuk mengimplementasikan sebuah interface?',
        answer: ['implements', 'keyword implements'],
        name: 'implements',
        explanation: 'Keyword implements mewajibkan class untuk merealisasikan seluruh kontrak method di dalam interface.'
    },
    {
        id: 'php-a-dir-h05',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'hard',
        question: 'Sebutkan nama magic method yang dipanggil saat script mencoba membaca property objek yang bersifat private atau tidak dideklarasikan!',
        answer: ['__get', '__get()'],
        name: '__get()',
        explanation: '__get($name) dipanggil otomatis saat mengakses inaccessible atau non-existent property.'
    },
    {
        id: 'php-a-dir-h06',
        topic: 'php-advance',
        type: 'direct',
        difficulty: 'hard',
        question: 'Sebutkan nama magic method yang dipanggil saat script mencoba menulis atau mengubah nilai pada property yang tidak dideklarasikan atau private!',
        answer: ['__set', '__set()'],
        name: '__set()',
        explanation: '__set($name, $value) dipanggil otomatis saat memberikan nilai ke inaccessible atau undefined property.'
    },

    // ==========================================
    // DEVOPS - TAMBAHAN (8)
    // ==========================================
    {
        id: 'dev-mc-11',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Berapa nomor port standar yang digunakan oleh protokol DNS (Domain Name System)?',
        options: ['A) 25', 'B) 53', 'C) 110', 'D) 123'],
        answer: ['b', 'b)', '53', 'port 53'],
        name: 'B) 53',
        explanation: 'DNS melayani permintaan resolusi domain ke IP melalui port 53 (terutama via protokol UDP).'
    },
    {
        id: 'dev-mc-12',
        topic: 'devops',
        type: 'mc',
        difficulty: 'normal',
        question: 'Perintah CLI Docker apa yang digunakan untuk mengeksekusi perintah shell interaktif di dalam container yang sedang berjalan?',
        options: ['A) docker attach', 'B) docker exec -it <id> sh', 'C) docker run -d', 'D) docker start'],
        answer: ['b', 'b)', 'docker exec', 'docker exec -it'],
        name: 'B) docker exec -it <id> sh',
        explanation: 'docker exec menjalankan command baru di dalam container yang sedang aktif.'
    },
    {
        id: 'dev-mc-h05',
        topic: 'devops',
        type: 'mc',
        difficulty: 'hard',
        question: 'Tipe Kubernetes Service default apa yang hanya mengekspos service di dalam internal IP cluster (tidak dapat diakses dari internet)?',
        options: ['A) NodePort', 'B) LoadBalancer', 'C) ClusterIP', 'D) ExternalName'],
        answer: ['c', 'c)', 'clusterip'],
        name: 'C) ClusterIP',
        explanation: 'ClusterIP adalah tipe service default yang menetapkan IP virtual internal dan hanya dapat dijangkau dari dalam cluster.'
    },
    {
        id: 'dev-mc-h06',
        topic: 'devops',
        type: 'mc',
        difficulty: 'hard',
        question: 'Dalam konfigurasi Nginx reverse proxy, direktif apa yang bertugas meneruskan request HTTP ke server aplikasi backend?',
        options: ['A) forward_to', 'B) proxy_pass', 'C) backend_target', 'D) upstream_send'],
        answer: ['b', 'b)', 'proxy_pass'],
        name: 'B) proxy_pass',
        explanation: 'proxy_pass menetapkan protokol dan alamat server proksi tujuan yang akan menerima penerusan request.'
    },
    {
        id: 'dev-dir-11',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Konversikan nilai oktet desimal netmask 240 ke dalam format biner 8-bit!',
        answer: ['11110000'],
        name: '11110000',
        explanation: '240 = 128 + 64 + 32 + 16 = 11110000 dalam biner 8-bit.'
    },
    {
        id: 'dev-dir-12',
        topic: 'devops',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nomor port default TCP yang digunakan untuk protokol web HTTP yang tidak terenkripsi?',
        answer: ['80', 'port 80'],
        name: '80',
        explanation: 'HTTP standar tanpa SSL/TLS beroperasi pada port TCP 80.'
    },
    {
        id: 'dev-dir-h05',
        topic: 'devops',
        type: 'direct',
        difficulty: 'hard',
        question: 'Berapa jumlah host IP usable yang dapat digunakan pada subnet point-to-point IPv4 berukuran /30?',
        answer: ['2', 'dua'],
        name: '2',
        explanation: 'Subnet /30 memiliki 2^(32-30) = 4 IP total. Dikurangi 2 (network dan broadcast) = 2 usable host IP.'
    },
    {
        id: 'dev-dir-h06',
        topic: 'devops',
        type: 'direct',
        difficulty: 'hard',
        question: 'Konversikan bilangan biner 8-bit 11001000 ke dalam bilangan desimal!',
        answer: ['200'],
        name: '200',
        explanation: '11001000 = 128 + 64 + 8 = 200 desimal.'
    },

    // ==========================================
    // HARDWARE - TAMBAHAN (8)
    // ==========================================
    {
        id: 'hw-mc-11',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Tipe memori flash NAND apa yang menyimpan 1 bit data per sel dan memiliki ketahanan siklus tulis (endurance) tertinggi?',
        options: ['A) SLC (Single-Level Cell)', 'B) MLC (Multi-Level Cell)', 'C) TLC (Triple-Level Cell)', 'D) QLC (Quad-Level Cell)'],
        answer: ['a', 'a)', 'slc', 'single-level cell'],
        name: 'A) SLC (Single-Level Cell)',
        explanation: 'SLC menyimpan 1 bit per sel sehingga memiliki kecepatan tertinggi dan daya tahan write cycles paling awet.'
    },
    {
        id: 'hw-mc-12',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'normal',
        question: 'Fitur apa pada monitor dan GPU yang menyinkronkan refresh rate monitor dengan frame rate kartu grafis untuk menghilangkan screen tearing?',
        options: ['A) Ray Tracing', 'B) VRR (Variable Refresh Rate) / G-Sync / FreeSync', 'C) HDR', 'D) Antialiasing'],
        answer: ['b', 'b)', 'vrr', 'g-sync', 'freesync'],
        name: 'B) VRR (Variable Refresh Rate) / G-Sync / FreeSync',
        explanation: 'VRR menyesuaikan refresh rate layar secara dinamis agar selaras dengan output GPU, mengeliminasi tearing dan stutter.'
    },
    {
        id: 'hw-mc-h05',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'hard',
        question: 'Pada arsitektur prosesor hybrid modern (misal: Intel Alder Lake / Raptor Lake), apa peran dari E-Core (Efficiency Core)?',
        options: [
            'A) Menjalankan instruksi rendering 3D grafis utama',
            'B) Menangani background task dan komputasi multi-thread ringan dengan efisiensi daya tinggi',
            'C) Mengatur tegangan VRM motherboard',
            'D) Mengontrol koneksi Thunderbolt'
        ],
        answer: ['b', 'b)', 'background task efisiensi daya', 'e-core'],
        name: 'B) Menangani background task dan komputasi multi-thread ringan dengan efisiensi daya tinggi',
        explanation: 'E-Core mengonsumsi daya jauh lebih rendah dan dirancang untuk memproses background task agar P-Core dapat fokus pada beban berat.'
    },
    {
        id: 'hw-mc-h06',
        topic: 'hardware',
        type: 'mc',
        difficulty: 'hard',
        question: 'Berapa bandwidth teoritis transfer data per satu lane (x1) pada bus PCIe versi 5.0 dalam satuan GB/s?',
        options: ['A) Sekitar 1 GB/s', 'B) Sekitar 2 GB/s', 'C) Sekitar 4 GB/s (3.94 GB/s)', 'D) Sekitar 8 GB/s'],
        answer: ['c', 'c)', 'sekitar 4 gb/s', '4 gb/s', '4'],
        name: 'C) Sekitar 4 GB/s (3.94 GB/s)',
        explanation: 'PCIe 5.0 menggandakan bandwidth PCIe 4.0 menjadi ~3.94 GB/s per lane, atau ~63 GB/s pada slot x16.'
    },
    {
        id: 'hw-dir-11',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa jumlah pin pada konektor daya utama motherboard standar ATX? (tulis angka 24)',
        answer: ['24', '24 pin'],
        name: '24 Pin',
        explanation: 'Konektor daya utama motherboard ATX modern standar memiliki 24 pin konduktor.'
    },
    {
        id: 'hw-dir-12',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'normal',
        question: 'Berapa nomor generasi standar PCI Express yang memiliki kecepatan bandwidth sekitar 2 GB/s per lajur (lane x1)? (tulis angka 4)',
        answer: ['4', 'PCIe 4', 'PCIe 4.0', 'Gen 4'],
        name: 'PCIe 4.0',
        explanation: 'PCIe 4.0 menyediakan throughput sekitar 1.97 GB/s (~2 GB/s) per lane.'
    },
    {
        id: 'hw-dir-h05',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'hard',
        question: 'Kombinasi tingkat RAID berapa yang menggabungkan mirroring (RAID 1) dan striping (RAID 0) sekaligus untuk kecepatan dan redundansi? (contoh: RAID 10)',
        answer: ['RAID 10', '10', 'RAID 1+0', 'raid 10'],
        name: 'RAID 10',
        explanation: 'RAID 10 (atau RAID 1+0) menduplikasi data (mirror) lalu membaginya (stripe) di minimal 4 drive penyimpanan.'
    },
    {
        id: 'hw-dir-h06',
        topic: 'hardware',
        type: 'direct',
        difficulty: 'hard',
        question: 'Fenomena penurunan clock speed CPU secara otomatis untuk mencegah kerusakan akibat suhu yang melampaui batas batas aman disebut thermal apa?',
        answer: ['throttling', 'thermal throttling'],
        name: 'Thermal Throttling',
        explanation: 'Thermal Throttling adalah mekanisme proteksi otomatis di mana CPU menurunkan frekuensi dan daya saat mencapai ambang suhu kritis.'
    }
];

export function getRandomCodingQuestion(topic?: CodingTopic): CodingQuestion {
    const pool = topic ? codingQuestions.filter(q => q.topic === topic) : codingQuestions;
    return pool[Math.floor(Math.random() * pool.length)];
}

export function getExamQuestions(topic: CodingTopic): CodingQuestion[] {
    const pool = codingQuestions.filter(q => q.topic === topic);

    const normalMC = pool.filter(q => q.type === 'mc' && q.difficulty === 'normal');
    const hardMC = pool.filter(q => q.type === 'mc' && q.difficulty === 'hard');
    const normalDirect = pool.filter(q => q.type === 'direct' && q.difficulty === 'normal');
    const hardDirect = pool.filter(q => q.type === 'direct' && q.difficulty === 'hard');

    // Shuffle helper
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Pick 8 normal MC + 2 hard MC = 10 MC
    const selectedMC = [
        ...shuffle(normalMC).slice(0, 8),
        ...shuffle(hardMC).slice(0, 2)
    ];

    // Pick 8 normal Direct + 2 hard Direct = 10 Direct
    const selectedDirect = [
        ...shuffle(normalDirect).slice(0, 8),
        ...shuffle(hardDirect).slice(0, 2)
    ];

    // Combine and shuffle order of questions for the exam (Total 20: 10 MC, 10 Direct, 4 Hard, 16 Normal)
    return shuffle([...selectedMC, ...selectedDirect]);
}

// Aliases for aliases command
export const codingAliases = {
    'php-basic': Object.fromEntries(
        codingQuestions.filter(q => q.topic === 'php-basic').map(q => [q.id, { answer: q.answer }])
    ),
    'php-advance': Object.fromEntries(
        codingQuestions.filter(q => q.topic === 'php-advance').map(q => [q.id, { answer: q.answer }])
    ),
    'devops': Object.fromEntries(
        codingQuestions.filter(q => q.topic === 'devops').map(q => [q.id, { answer: q.answer }])
    ),
    'hardware': Object.fromEntries(
        codingQuestions.filter(q => q.topic === 'hardware').map(q => [q.id, { answer: q.answer }])
    )
};
