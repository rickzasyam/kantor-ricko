// Denah Kantor Ricko untuk tampilan 3D: ruangan, pintu, lantai, furnitur, kursi, futon, tempat
// santai, plus peta jalan (ubin mana yang bisa diinjak) dan pencari jalan.
//
// Berkas ini murni data + hitungan (tanpa Three.js), supaya bisa diuji dengan Node
// (uji/denah.test.mjs) dan dipakai apa adanya oleh browser.
//
// Satuan: ubin. x = kolom (barat -> timur), z = baris (utara -> selatan). Titik (x, z) bulat
// adalah pojok kiri-atas ubin; tengah ubin (c, r) = (c + 0.5, r + 0.5).
//
//   ┌──────────┬─────────┬──────────────┬───────────┐
//   │  Ricko   │ Manager │   Meeting    │ Matcha Bar│             baris 2-10
//   ├──────────┴─────────┼──────┬───────┴───────────┼────────┐    dinding baris 11
//   │      Workroom      │Lounge│     Game Room     │  Mess  │    baris 12-21
//   ├─────────┬──────────┴──────┴───────────────────┼────────┘    dinding baris 22
//   │  Dojo   │               Onsen                 │             baris 23-33
//   └─────────┴─────────────────────────────────────┘

export const COLS = 61
export const ROWS = 36

// Ruangan: c/r = rentang kolom/baris (termasuk ujung). `papan` = tulisan papan nama (bahasa Inggris).
export const RUANG = [
  { id: 'ricko', papan: 'RICKO', c: [2, 11], r: [2, 10], lantai: 'oak' },
  { id: 'manajer', papan: 'MANAGER', c: [13, 21], r: [2, 10], lantai: 'oak' },
  { id: 'rapat', papan: 'MEETING', c: [23, 34], r: [2, 10], lantai: 'oak' },
  { id: 'matcha', papan: 'MATCHA BAR', c: [36, 47], r: [2, 10], lantai: 'plester' },
  { id: 'kerja', papan: 'WORKROOM', c: [2, 21], r: [12, 21], lantai: 'oak' },
  { id: 'lounge', papan: 'LOUNGE', c: [23, 28], r: [12, 21], lantai: 'tatami' },
  { id: 'game', papan: 'GAME ROOM', c: [30, 47], r: [12, 21], lantai: 'walnut' },
  { id: 'dojo', papan: 'DOJO', c: [2, 12], r: [23, 33], lantai: 'tatami' },
  { id: 'onsen', papan: 'ONSEN', c: [14, 47], r: [23, 33], lantai: 'lumut', luar: true },
  { id: 'mess', papan: 'MESS', c: [49, 58], r: [12, 21], lantai: 'oak' },
]

// Petak lantai bermotif di dalam ruangan: [kolom, baris, lebar, tinggi, jenis lantai].
export const MOTIF = [
  [24, 3, 10, 7, 'permadani'],                       // rapat: permadani rami
  [2, 7, 5, 3, 'permadani'],                         // ricko: pojok baca
  [37, 2, 7, 3, 'batu'],                             // matcha: lantai batu di balik konter
  [43, 3, 5, 7, 'oak'],                              // matcha: area duduk
  [23, 12, 1, 10, 'oak'],                            // lounge: bingkai kayu
  [30, 13, 5, 4, 'tatami'],                          // game: tatami kotatsu
  [2, 23, 11, 3, 'oak'],                             // dojo: lajur alat
  [4, 29, 1, 3, 'matras1'], [6, 29, 1, 3, 'matras2'], [8, 29, 1, 3, 'matras3'],
  [14, 23, 34, 2, 'dek'],                            // onsen: dek kayu sepanjang fasad
  [41, 27, 7, 1, 'kerikil'], [40, 28, 8, 1, 'kerikil'], [39, 29, 9, 2, 'kerikil'], [40, 31, 8, 1, 'kerikil'], [41, 32, 7, 1, 'kerikil'],
  [50, 13, 8, 8, 'tatami'],                          // mess: tatami berbingkai kayu
]
// Batu pijakan di taman (ubin lumut dengan batu pipih).
export const BATU_PIJAK = [[14, 27], [15, 27], [16, 28], [17, 28], [18, 27], [19, 27], [20, 28], [21, 27], [21, 29], [34, 28], [35, 29], [36, 30], [37, 29], [38, 30], [27, 31], [29, 32]]

// Pintu: ubin dinding yang dibuka menjadi lantai.
export const PINTU = [
  [9, 11], [10, 11], [19, 11], [20, 11], [25, 11], [26, 11], [35, 7], [35, 8], [40, 11], [41, 11],
  [22, 13], [22, 16], [22, 17], [29, 16], [29, 17], [6, 22], [7, 22], [25, 22], [26, 22], [38, 22], [39, 22],
  [13, 27], [13, 28], [48, 14], [48, 15],
]
// Sayap timur hanya berisi Mess; atas dan bawahnya ruang kosong.
const KOSONG = [[49, 1, 11, 10], [49, 23, 11, 12]]

export const UBIN = { KOSONG: 0, DINDING: 1, LANTAI: 2, PAGAR: 3 }

// Tapak furnitur dalam ubin [lebar, dalam] saat tidak diputar. 0 = tidak menghalangi jalan.
export const TAPAK = {
  mejaKerja: [3, 1], mejaEksekutif: [3, 1], kursi: [0, 0], kursiEksekutif: [0, 0], bufet: [3, 1], rak: [2, 1], rakTeh: [4, 1],
  akuarium: [1, 1], sofa: [2, 1], mejaBulat: [1, 1], chabudai: [2, 1], zabuton: [0, 0], kursiTelur: [1, 1],
  mejaRapat: [6, 2], kursiRapat: [0, 0], konter: [6, 1], bangkuBar: [1, 1], mejaKafe: [1, 1],
  tvKonsol: [3, 1], kotatsu: [2, 1], zaisu: [0, 0], arcade: [1, 1], gachapon: [1, 1], biliar: [4, 2], foosball: [3, 1], beanBag: [0, 0],
  treadmill: [1, 2], rakDumbel: [2, 1], bench: [1, 2], samsak: [1, 1],
  futon: [1, 2], akari: [1, 1], bonsai: [1, 1], bambuPot: [1, 1], pakis: [1, 1], pedang: [1, 1], vasRanting: [1, 1],
  kolam: [0, 0], kapibara: [0, 0], rakHanduk: [1, 1], kursiDek: [1, 1], wagasa: [1, 1], bangku: [2, 1], rumpunBambu: [1, 1],
  toro: [1, 1], pinus: [1, 1], momiji: [1, 1], batu: [1, 1], batuBesar: [2, 1], semak: [1, 1],
}

const P = Math.PI
// Furnitur lantai: j = jenis (lihat model.js), x/z = titik tengah, r = putaran (0 = menghadap
// selatan/kamera, P = menghadap utara), sisanya opsi model.
export const FURNITUR = [
  // Ruang Ricko
  { j: 'mejaEksekutif', x: 5.5, z: 4.5 }, { j: 'kursiEksekutif', x: 5.5, z: 3.5 },
  { j: 'bufet', x: 9.5, z: 2.5 }, { j: 'bonsai', x: 2.5, z: 2.5 }, { j: 'akuarium', x: 2.5, z: 5.5 },
  { j: 'vasRanting', x: 10.5, z: 6.5 }, { j: 'sofa', x: 4, z: 8.5 }, { j: 'mejaBulat', x: 6.5, z: 8.5 }, { j: 'akari', x: 2.5, z: 9.5 },
  // Ruang Manajer
  { j: 'mejaEksekutif', x: 16.5, z: 4.5 }, { j: 'kursiEksekutif', x: 16.5, z: 3.5 },
  { j: 'rak', x: 14, z: 2.5 }, { j: 'bonsai', x: 21.5, z: 2.5 },
  { j: 'chabudai', x: 15, z: 8.5 }, { j: 'zabuton', x: 13.5, z: 9.6, warna: 'sage' }, { j: 'zabuton', x: 16.5, z: 9.6, warna: 'oat' },
  { j: 'bambuPot', x: 21.5, z: 9.5 }, { j: 'akari', x: 18.5, z: 9.5 },
  // Ruang Rapat
  { j: 'mejaRapat', x: 29, z: 6 },
  ...[0, 1, 2, 3, 4, 5].flatMap(i => [
    { j: 'kursiRapat', x: 26.5 + i, z: 4.5, warna: ['sage', 'oat', 'liat', 'indigo', 'oat', 'matcha'][i] },
    { j: 'kursiRapat', x: 26.5 + i, z: 7.5, r: P, warna: ['oat', 'indigo', 'sage', 'matcha', 'liat', 'sage'][i] },
  ]),
  { j: 'kursiRapat', x: 25.5, z: 6, r: P / 2, warna: 'sage' }, { j: 'kursiRapat', x: 32.5, z: 6, r: -P / 2, warna: 'oat' },
  { j: 'bambuPot', x: 23.5, z: 2.5 }, { j: 'bambuPot', x: 34.5, z: 2.5 }, { j: 'pedang', x: 23.5, z: 9.5 }, { j: 'pakis', x: 33.5, z: 9.5 },
  // Matcha Bar
  { j: 'rakTeh', x: 41, z: 2.5 }, { j: 'konter', x: 41, z: 5.5 },
  { j: 'bangkuBar', x: 38.5, z: 7.5, warna: 'sage' }, { j: 'bangkuBar', x: 40.5, z: 7.5, warna: 'oat' }, { j: 'bangkuBar', x: 42.5, z: 7.5, warna: 'sage' },
  { j: 'mejaKafe', x: 45.5, z: 4.5 }, { j: 'bangkuBar', x: 44.5, z: 4.5, warna: 'oat' }, { j: 'bangkuBar', x: 46.5, z: 4.5, warna: 'sage' },
  { j: 'mejaKafe', x: 45.5, z: 8.5 }, { j: 'bangkuBar', x: 44.5, z: 8.5, warna: 'sage' }, { j: 'bangkuBar', x: 46.5, z: 8.5, warna: 'oat' },
  { j: 'bambuPot', x: 36.5, z: 2.5 }, { j: 'pedang', x: 47.5, z: 6.5 }, { j: 'pedang', x: 37.5, z: 9.5 }, { j: 'rak', x: 46.5, z: 2.5 },
  // Ruang Kerja: 6 meja (5 karyawan + 1 cadangan)
  ...[[3, 13], [9, 13], [15, 13], [3, 17], [9, 17], [15, 17]].flatMap(([c, r], i) => [
    { j: 'mejaKerja', x: c + 1.5, z: r + 1.5, meja: i }, { j: 'kursi', x: c + 1.5, z: r + 2.5, r: P },
  ]),
  { j: 'bambuPot', x: 2.5, z: 12.5 }, { j: 'pakis', x: 7.5, z: 13.5 }, { j: 'akari', x: 13.5, z: 13.5 }, { j: 'pedang', x: 19.5, z: 13.5 },
  { j: 'akari', x: 7.5, z: 17.5 }, { j: 'bonsai', x: 13.5, z: 17.5 }, { j: 'pakis', x: 20.5, z: 19.5 }, { j: 'rak', x: 13, z: 21.5, r: P },
  // Lounge
  { j: 'rak', x: 24, z: 12.5 }, { j: 'kursiTelur', x: 27.5, z: 15.5 },
  { j: 'chabudai', x: 25, z: 19.5 }, { j: 'zabuton', x: 24.5, z: 20.6, warna: 'indigo' }, { j: 'zabuton', x: 25.6, z: 20.6, warna: 'liat' },
  { j: 'akari', x: 28.5, z: 20.5 },
  // Ruang Game
  { j: 'tvKonsol', x: 32.5, z: 12.5 }, { j: 'kotatsu', x: 32, z: 14.5 },
  { j: 'zaisu', x: 31.5, z: 15.6, r: P }, { j: 'zaisu', x: 32.5, z: 15.6, r: P, warna: 'sage' },
  { j: 'zaisu', x: 30.5, z: 14.5, r: P / 2 }, { j: 'zaisu', x: 33.6, z: 14.5, r: -P / 2, warna: 'sage' },
  { j: 'arcade', x: 35.5, z: 12.5 }, { j: 'arcade', x: 36.5, z: 12.5, warna: 'indigo' }, { j: 'gachapon', x: 37.5, z: 12.5 },
  { j: 'biliar', x: 38, z: 18 }, { j: 'foosball', x: 44.5, z: 14.5 },
  { j: 'sofa', x: 45, z: 16.5 }, { j: 'mejaBulat', x: 46.5, z: 17.5 },
  { j: 'beanBag', x: 43.5, z: 19.5, warna: 'oat' }, { j: 'beanBag', x: 45.5, z: 19.5, warna: 'sage' }, { j: 'beanBag', x: 44.5, z: 21, warna: 'liat' }, { j: 'beanBag', x: 46.5, z: 21, warna: 'indigo' },
  { j: 'akari', x: 47.5, z: 18.5 }, { j: 'pakis', x: 47.5, z: 12.5 }, { j: 'bambuPot', x: 30.5, z: 21.5 },
  // Dojo
  { j: 'treadmill', x: 2.5, z: 24 }, { j: 'treadmill', x: 4.5, z: 24 }, { j: 'rakDumbel', x: 10, z: 23.5 }, { j: 'bench', x: 12.5, z: 24 },
  { j: 'samsak', x: 11.5, z: 30.5 },
  { j: 'zabuton', x: 4.5, z: 32.5, warna: 'sage' }, { j: 'zabuton', x: 6.5, z: 32.5, warna: 'liat' }, { j: 'zabuton', x: 8.5, z: 32.5, warna: 'oat' },
  { j: 'bonsai', x: 2.5, z: 33.5 }, { j: 'bambuPot', x: 12.5, z: 33.5 },
  // Taman Onsen
  { j: 'kolam', x: 27.5, z: 28.5 }, { j: 'kapibara', x: 30.6, z: 28.9 },
  { j: 'rakHanduk', x: 21.5, z: 23.5 }, { j: 'kursiDek', x: 44.5, z: 23.5 }, { j: 'kursiDek', x: 46.5, z: 23.5 },
  { j: 'wagasa', x: 14.5, z: 23.5 }, { j: 'bangku', x: 16, z: 23.5 },
  { j: 'rumpunBambu', x: 14.5, z: 25.5 }, { j: 'rumpunBambu', x: 14.5, z: 30.5 }, { j: 'rumpunBambu', x: 46.5, z: 30.5 },
  { j: 'toro', x: 17.5, z: 30.5 }, { j: 'toro', x: 38.5, z: 26.5 }, { j: 'pinus', x: 18.5, z: 32.5 }, { j: 'momiji', x: 35.5, z: 26.5 },
  { j: 'batuBesar', x: 23, z: 32.5 }, { j: 'batu', x: 40.5, z: 32.5 }, { j: 'batu', x: 46.5, z: 27.5 }, { j: 'batu', x: 43.5, z: 29.5, besar: 1.4 },
  { j: 'semak', x: 16.5, z: 33.5 }, { j: 'semak', x: 36.5, z: 33.5 }, { j: 'semak', x: 44.5, z: 33.5 }, { j: 'semak', x: 31.5, z: 33.5 }, { j: 'semak', x: 21.5, z: 33.5 },
  // Mess: futon ke-n milik karyawan ke-n di tools/karyawan.json (lihat KASUR di bawah)
  ...['sage', 'sakura', 'matcha', 'indigo', 'liat', 'emas'].map((warna, i) => ({ j: 'futon', x: 51.5 + (i % 3) * 3, z: i < 3 ? 14 : 19, warna })),
  { j: 'akari', x: 49.5, z: 12.5 }, { j: 'bonsai', x: 58.5, z: 12.5 }, { j: 'akari', x: 58.5, z: 21.5 }, { j: 'bambuPot', x: 49.5, z: 21.5 }, { j: 'mejaBulat', x: 54.5, z: 16.5 },
]

// Hiasan dinding: menempel di muka selatan dinding baris `d`, di kolom x.
export const HIASAN = [
  { j: 'jendela', x: 3.5, d: 1 }, { j: 'lukisan', x: 6.5, d: 1 }, { j: 'kokedama', x: 11.3, d: 1 },
  { j: 'papanWashi', x: 14.5, d: 1 }, { j: 'gulungan', x: 19, d: 1 }, { j: 'jendela', x: 21, d: 1 },
  { j: 'jendela', x: 24.5, d: 1 }, { j: 'tv', x: 28.5, d: 1 }, { j: 'jendela', x: 34, d: 1 },
  { j: 'marumado', x: 44.5, d: 1 }, { j: 'papanMenu', x: 47, d: 1 },
  { j: 'rakDinding', x: 3.5, d: 11 }, { j: 'lukisan', x: 6.5, d: 11, motif: 'ombak' }, { j: 'jam', x: 8.3, d: 11 }, { j: 'gulungan', x: 16.5, d: 11 }, { j: 'kokedama', x: 18, d: 11 }, { j: 'kokedama', x: 21.5, d: 11 },
  { j: 'marumado', x: 28, d: 11 },
  { j: 'tv', x: 32.5, d: 11, game: true }, { j: 'lukisan', x: 35.5, d: 11, motif: 'fuji' }, { j: 'lampion', x: 44.5, d: 11 }, { j: 'kokedama', x: 47.5, d: 11 },
  { j: 'cermin', x: 3.5, d: 22 }, { j: 'rakBokken', x: 9.5, d: 22 },
  { j: 'jendela', x: 15.5, d: 22 }, { j: 'chochin', x: 24.3, d: 22 }, { j: 'chochin', x: 27.7, d: 22 }, { j: 'jendela', x: 32.5, d: 22 },
  { j: 'chochin', x: 37.3, d: 22 }, { j: 'chochin', x: 40.7, d: 22 }, { j: 'jendela', x: 44, d: 22 },
  { j: 'jendela', x: 50.5, d: 11 }, { j: 'marumado', x: 56.5, d: 11 }, { j: 'kokedama', x: 58.5, d: 11 },
]
// Letak papan nama ruangan: [id ruang, kolom x, baris dinding].
export const PAPAN = [['ricko', 8.8, 1], ['manajer', 17, 1], ['rapat', 31.5, 1], ['matcha', 38, 1], ['kerja', 12.5, 11], ['lounge', 24, 11], ['game', 38, 11], ['dojo', 11.5, 22], ['onsen', 19.5, 22], ['mess', 53.5, 11]]

const U = 'U', S = 'S', T = 'T', B = 'B'   // arah hadap: Utara, Selatan, Timur, Barat
export const SUDUT = { S: 0, T: P / 2, U: P, B: -P / 2 }

// Kursi kerja: ubin tempat duduk, titik duduk, arah hadap. `pemilik` = id karyawan (nama folder sesi).
export const KURSI = [
  { pemilik: 'ricko', ubin: [5, 3], pos: [5.5, 3.6], hadap: S },
  { pemilik: 'pak-asep', ubin: [16, 3], pos: [16.5, 3.6], hadap: S },
  ...['kokom', 'ujang', 'joko', 'neneng', 'ayu', null].map((pemilik, i) => {
    const [c, r] = [[3, 13], [9, 13], [15, 13], [3, 17], [9, 17], [15, 17]][i]
    return { pemilik, meja: i, ubin: [c + 1, r + 2], pos: [c + 1.5, r + 2.4], hadap: U }
  }),
]
// Futon di Mess, urut seperti tools/karyawan.json.
export const KASUR = [0, 1, 2, 3, 4, 5].map(i => ({ ubin: [51 + (i % 3) * 3, i < 3 ? 14 : 19], pos: [51.5 + (i % 3) * 3, i < 3 ? 14 : 19] }))
// Kursi rapat; yang pertama = kepala meja (pemimpin rapat).
export const KURSI_RAPAT = [
  { ubin: [25, 6], pos: [25.5, 6], hadap: T },
  ...[0, 1, 2, 3, 4, 5].flatMap(i => [{ ubin: [26 + i, 4], pos: [26.5 + i, 4.6], hadap: S }, { ubin: [26 + i, 7], pos: [26.5 + i, 7.4], hadap: U }]),
  { ubin: [32, 6], pos: [32.5, 6], hadap: B },
]

// Tempat santai saat menganggur: pose (lihat tokoh.js), lama (detik), bobot = seberapa sering dipilih.
export const TEMPAT = [
  ...[[39, 6], [41, 6]].map(([c, r]) => ({ jenis: 'matcha', ubin: [c, r], pos: [c + 0.5, r + 0.45], hadap: U, pose: 'minum', lama: [10, 16], bobot: 3 })),
  ...[[25.4, 28.4], [27.6, 29], [28.6, 27.9]].map(([x, z]) => ({ jenis: 'onsen', ubin: [Math.floor(x), Math.floor(z)], pos: [x, z], hadap: S, pose: 'rendam', lama: [30, 60], bobot: 3 })),
  { jenis: 'game', ubin: [31, 15], pos: [31.5, 15.5], hadap: U, pose: 'lesehan', lama: [25, 50], bobot: 1.5 },
  { jenis: 'game', ubin: [32, 15], pos: [32.5, 15.5], hadap: U, pose: 'lesehan', lama: [25, 50], bobot: 1.5 },
  { jenis: 'arcade', ubin: [35, 13], pos: [35.5, 13.4], hadap: U, pose: 'main', lama: [15, 30], bobot: 1 },
  { jenis: 'arcade', ubin: [36, 13], pos: [36.5, 13.4], hadap: U, pose: 'main', lama: [15, 30], bobot: 1 },
  { jenis: 'biliar', ubin: [37, 19], pos: [37.5, 19.3], hadap: U, pose: 'main', lama: [20, 35], bobot: 1 },
  { jenis: 'biliar', ubin: [40, 18], pos: [40.4, 18], hadap: B, pose: 'main', lama: [20, 35], bobot: 1 },
  { jenis: 'foosball', ubin: [44, 15], pos: [44.5, 15.3], hadap: U, pose: 'main', lama: [20, 35], bobot: 1 },
  { jenis: 'lari', ubin: [2, 24], pos: [2.5, 24.1], hadap: U, pose: 'lari', lama: [20, 35], bobot: 1 },
  { jenis: 'lari', ubin: [4, 24], pos: [4.5, 24.1], hadap: U, pose: 'lari', lama: [20, 35], bobot: 1 },
  { jenis: 'tinju', ubin: [10, 30], pos: [10.7, 30.5], hadap: T, pose: 'tinju', lama: [15, 25], bobot: 1 },
  ...[4, 6, 8].map(c => ({ jenis: 'meditasi', ubin: [c, 32], pos: [c + 0.5, 32.5], hadap: S, pose: 'meditasi', lama: [25, 45], bobot: 0.7 })),
  { jenis: 'teh', ubin: [24, 20], pos: [24.5, 20.6], hadap: U, pose: 'lesehan', lama: [20, 40], bobot: 1 },
  { jenis: 'teh', ubin: [25, 20], pos: [25.6, 20.6], hadap: U, pose: 'lesehan', lama: [20, 40], bobot: 1 },
  { jenis: 'santai', ubin: [43, 19], pos: [43.5, 19.5], hadap: S, pose: 'lesehan', lama: [20, 40], bobot: 1 },
  { jenis: 'santai', ubin: [45, 19], pos: [45.5, 19.5], hadap: S, pose: 'lesehan', lama: [20, 40], bobot: 1 },
  { jenis: 'taman', ubin: [16, 23], pos: [16.3, 23.6], hadap: S, pose: 'duduk', lama: [20, 40], bobot: 1.5 },
  { jenis: 'taman', ubin: [44, 23], pos: [44.5, 23.6], hadap: S, pose: 'duduk', lama: [20, 40], bobot: 1 },
]

/** Kolam onsen: elips air (dipakai model, peta jalan, dan tempat berendam). */
export const KOLAM = { x: 27.5, z: 28.5, rx: 4.6, rz: 2.1 }

const idx = (c, r) => r * COLS + c

/** Bangun peta ubin: jenis tiap ubin, jenis lantainya, ruangannya, dan ubin yang terhalang furnitur. */
export function bangunPeta() {
  const n = COLS * ROWS
  const ubin = new Uint8Array(n), lantai = Array(n).fill(null), ruang = Array(n).fill(null), halang = new Uint8Array(n), air = new Uint8Array(n)
  for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) ubin[idx(c, r)] = UBIN.DINDING
  for (const [c0, r0, w, h] of KOSONG) for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) ubin[idx(c, r)] = UBIN.KOSONG
  for (const x of RUANG) for (let r = x.r[0]; r <= x.r[1]; r++) for (let c = x.c[0]; c <= x.c[1]; c++) {
    ubin[idx(c, r)] = UBIN.LANTAI; lantai[idx(c, r)] = x.lantai; ruang[idx(c, r)] = x.id
  }
  for (const [c0, r0, w, h, jenis] of MOTIF) for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) lantai[idx(c, r)] = jenis
  for (const [c, r] of BATU_PIJAK) lantai[idx(c, r)] = 'pijak'
  const tetangga = (c, r) => [[c, r + 1], [c, r - 1], [c - 1, r], [c + 1, r]].map(([x, z]) => ruang[idx(x, z)]).find(Boolean)
  for (const [c, r] of PINTU) {
    const id = tetangga(c, r)
    ubin[idx(c, r)] = UBIN.LANTAI; ruang[idx(c, r)] = id; lantai[idx(c, r)] = RUANG.find(x => x.id === id)?.lantai ?? 'oak'
  }
  // Batas taman onsen (selatan & timur) berupa pagar bambu, bukan dinding plester.
  for (let r = 1; r <= ROWS - 2; r++) for (let c = 1; c <= COLS - 2; c++) {
    if (ubin[idx(c, r)] !== UBIN.DINDING) continue
    const dekatTaman = [[c, r - 1], [c - 1, r], [c - 1, r - 1]].some(([x, z]) => ruang[idx(x, z)] === 'onsen')
    if (dekatTaman && (r === ROWS - 2 || (c === 48 && r >= 23))) ubin[idx(c, r)] = UBIN.PAGAR
  }
  for (const f of FURNITUR) {
    const t = TAPAK[f.j]
    if (!t) throw new Error(`jenis furnitur tidak dikenal: ${f.j}`)
    const miring = Math.abs(Math.sin(f.r ?? 0)) > 0.5
    const w = miring ? t[1] : t[0], d = miring ? t[0] : t[1]
    if (!w || !d) continue
    for (let r = Math.floor(f.z - d / 2 + 0.01); r < f.z + d / 2 - 0.01; r++) for (let c = Math.floor(f.x - w / 2 + 0.01); c < f.x + w / 2 - 0.01; c++) halang[idx(c, r)] = 1
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const dx = (c + 0.5 - KOLAM.x) / (KOLAM.rx + 0.4), dz = (r + 0.5 - KOLAM.z) / (KOLAM.rz + 0.4)
    if (dx * dx + dz * dz < 1) air[idx(c, r)] = 1          // kolam: hanya dilewati kalau memang mau berendam
  }
  for (const k of KURSI) halang[idx(...k.ubin)] = 1          // kursi kerja: hanya pemiliknya yang ke sana
  for (const k of KURSI_RAPAT) halang[idx(...k.ubin)] = 1
  const bisa = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && ubin[idx(c, r)] === UBIN.LANTAI && !halang[idx(c, r)] && !air[idx(c, r)]
  return { ubin, lantai, ruang, halang, air, bisa, idx }
}

/**
 * Cari jalan (BFS 4 arah) dari ubin [c0, r0] ke [c1, r1]. Ubin tujuan boleh terhalang (kursi,
 * futon, kolam): karakter melangkah masuk dari ubin kosong di sebelahnya. Mengembalikan daftar
 * ubin setelah titik awal, [] kalau sudah di tujuan, atau null kalau tidak ada jalan.
 */
export function cariJalan(peta, [c0, r0], [c1, r1]) {
  if (c0 === c1 && r0 === r1) return []
  const asal = new Int32Array(COLS * ROWS).fill(-1), antre = [idx(c0, r0)]
  const masukAir = peta.air[idx(c1, r1)] || peta.air[idx(c0, r0)]     // menuju / keluar dari kolam: boleh mengarungi air
  asal[idx(c0, r0)] = idx(c0, r0)
  for (let k = 0; k < antre.length; k++) {
    const i = antre[k], c = i % COLS, r = (i - c) / COLS
    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nc = c + dc, nr = r + dr, j = idx(nc, nr)
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || asal[j] >= 0) continue
      const tujuan = nc === c1 && nr === r1
      if (!tujuan && !peta.bisa(nc, nr) && !(masukAir && peta.air[j] && !peta.halang[j])) continue
      if (tujuan && peta.ubin[j] !== UBIN.LANTAI) continue
      asal[j] = i
      if (tujuan) {
        const jalur = []
        for (let p = j; p !== idx(c0, r0); p = asal[p]) jalur.unshift([p % COLS, Math.floor(p / COLS)])
        return jalur
      }
      antre.push(j)
    }
  }
  return null
}
