// Patch pixel-agents 1.4.1 untuk Kantor Ricko. Diterapkan ke salinan asli tiap file
// (disimpan sebagai <file>.asli), jadi aman dijalankan berulang kali dan setelah patch diubah.
//
// Server (dist/cli.js):
// 1. Karakter tetap per karyawan: fungsi pemilih karakter (`ae`) membaca file JSON di env
//    KANTOR_KARAKTER ({ "<nama folder>": <nomor karakter> }) sebelum mengundi karakter.
// 2. Pulihkan karyawan saat server menyala: bawaannya agen lama baru dipulihkan saat browser
//    tersambung, padahal sebelum itu server sudah menimpa daftar agen dengan sesi yang baru
//    terdeteksi -- karyawan yang sedang menganggur jadi hilang dari kantor.
// 3. Mode rapat: tiap 3 detik server membaca ~/.pixel-agents/kantor-rapat.json (ditulis
//    tools/rapat.mjs) dan menyiarkannya ke browser sebagai pesan `kantorRapat`.
//
// Tampilan (dist/webview/assets/index-*.js):
// 4. Mode rapat: selama rapat aktif, karakter peserta pindah ke kursi di Ruang Rapat dan tetap
//    duduk di sana (tidak jalan-jalan). Pemimpin rapat duduk di kepala meja (kursi paling kiri).
//    Setelah rapat selesai mereka kembali ke kursi semula. Kursi rapat tidak disimpan ke server.
//    Sekalian penjaga ruangan: karyawan yang duduk di luar ruangannya (areaMappings) -- misalnya
//    karena kursinya terpilih sebelum pembagian ruangan termuat -- dipindah ke ruangannya.
// 5. Label karakter: nama folder ("asep") diganti nama karyawan ("Pak Asep") dengan jabatan
//    di bawahnya ("Manager"). Data dari tools/karyawan.json (nama, jabatan) + PROFIL_LAIN.
// 6. Animasi ambien: furnitur dengan grup animasi di luar state on/off (onsen, akuarium,
//    lentera, bambu, ...) beranimasi terus, tidak hanya saat ada karyawan yang bekerja di depannya.
// 7. Aktivitas karyawan saat menganggur (aktivitas.js): ambil matcha lalu minum di meja, berendam
//    di onsen, main game di kotatsu, biliar, arcade, foosball, treadmill, dumbel, samsak, rebahan
//    di bean bag, minum teh di zabuton, meditasi, duduk di bangku taman.
// 8. Satpam: sesi Claude Code di luar kantor (folder lain di PC) tidak ditampilkan.
// 9. Cahaya hangat (cahaya.js): peta cahaya pagi/siang/sore/malam ditumpuk di atas kantor.
// 11. Kuota & izin (status.js, + siaran di server): panel kuota Claude Pro dan gelembung
//     "Needs approval" untuk karyawan yang menunggu izin (dari ~/.claude/sessions/*.json).
// 12. Status kerja & label bahasa Indonesia (status-alat.js): "Using mcp__..." -> "Membaca Google Sheets",
//     Idle -> "Lagi santai", Needs approval -> "Menunggu izin Pak Ricko".
//
// Gaya (dist/webview/assets/index-*.css):
// 10. Tema antarmuka hangat: variabel warna bawaan (ungu neon) ditimpa arang + aksen matcha.
//
// Jalankan ulang setelah `npm install`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.join(HERE, 'node_modules', 'pixel-agents')
const DIST = path.join(PKG, 'dist')

// Nama & jabatan yang tampil di label karakter, per nama folder sesi (huruf kecil).
const PROFIL_LAIN = { ricko: { nama: 'Pak Ricko', jabatan: 'Owner' } }
function bacaProfil() {
  const roster = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'tools', 'karyawan.json'), 'utf8'))
  const profil = { ...PROFIL_LAIN }
  for (const k of roster) profil[k.id.split('-').pop().toLowerCase()] = { nama: k.nama, jabatan: k.jabatan ?? k.role }
  return profil
}

const KARAKTER_TETAP = {
  nama: 'karakter tetap per karyawan',
  cari: 'function ae(t,e){if(t.palette!==void 0)return;',
  ganti:
    'var __kantorPeta;function __kantorKarakter(t){try{if(__kantorPeta===void 0){var f=process.env.KANTOR_KARAKTER;' +
    '__kantorPeta=f?JSON.parse(require("fs").readFileSync(f,"utf8")):null}}catch(e){__kantorPeta=null}' +
    'if(!__kantorPeta||!t.folderName)return void 0;var v=__kantorPeta[String(t.folderName).toLowerCase()];' +
    'return typeof v==="number"&&v>=0&&v<64?v:void 0}' +
    'function ae(t,e){var __k=__kantorKarakter(t);if(__k!==void 0){t.palette=__k;t.hueShift=0;return}' +
    'if(t.palette!==void 0)return;',
}

const PULIHKAN_KARYAWAN = {
  nama: 'pulihkan karyawan saat server menyala',
  cari: 'u.startProjectScan(x),u.startExternalScanning(x),u.startStaleCheck()',
  ganti: 'u.restoreExternalAgents(),u.startProjectScan(x),u.startExternalScanning(x),u.startStaleCheck()',
}

// `c` = penyimpan agen (punya .broadcast ke semua browser) di fungsi utama server.
const RAPAT_SERVER = {
  nama: 'siarkan status rapat',
  cari: 'let A=t.host==="0.0.0.0"',
  ganti:
    '(function(st){var fs=require("fs"),f=require("path").join(require("os").homedir(),".pixel-agents","kantor-rapat.json");' +
    'setInterval(function(){var d=null;try{d=JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){d=null}' +
    'var aktif=!!(d&&d.aktif&&(!d.sampai||Date.parse(d.sampai)>Date.now()));' +
    'st.broadcast(Object.assign({},d||{},{type:"kantorRapat",aktif:aktif}))},3000).unref()})(c);' +
    'let A=t.host==="0.0.0.0"',
}

// Status kantor (lihat status.js): tiap 3 detik server membaca kuota (~/.pixel-agents/
// kantor-kuota.json, ditulis tools/status-kantor.mjs) dan status sesi Claude Code
// (~/.claude/sessions/<pid>.json). Sesi yang menunggu izin dicocokkan ke agen lewat sessionId
// (= nama file transkrip). `c` = penyimpan agen (c.agents: Map id -> agen).
const STATUS_SERVER = {
  nama: 'siarkan kuota & izin',
  cari: 'let A=t.host==="0.0.0.0"',
  ganti:
    '(function(st){var fs=require("fs"),path=require("path"),home=require("os").homedir(),' +
    'fk=path.join(home,".pixel-agents","kantor-kuota.json"),ds=path.join(home,".claude","sessions");' +
    'function hidup(pid){try{process.kill(pid,0);return true}catch(e){return e.code==="EPERM"}}' +
    'setInterval(function(){var k=null;try{k=JSON.parse(fs.readFileSync(fk,"utf8"))}catch(e){}' +
    'var tunggu=new Set;try{fs.readdirSync(ds).forEach(function(n){if(!/\\.json$/.test(n))return;' +
    'try{var s=JSON.parse(fs.readFileSync(path.join(ds,n),"utf8"));' +
    'if(s.status==="waiting"&&/permission/i.test(s.waitingFor||"")&&hidup(s.pid))tunggu.add(s.sessionId)}catch(e){}})}catch(e){}' +
    'var izin=[];st.agents.forEach(function(a,id){if(a&&tunggu.has(a.sessionId))izin.push(id)});' +
    'st.broadcast({type:"kantorStatus",kuota:k,izin:izin})},3000).unref()})(c);' +
    'let A=t.host==="0.0.0.0"',
}

// Status kerja dalam bahasa manusia (lihat status-alat.js): `ps` membuat teks status dari nama tool.
const STATUS_ALAT = {
  nama: 'status kerja bahasa Indonesia',
  cari: 'function ps(t,e){return Q?.formatToolStatus(t,e)??`Using ${t}`}',
  ganti: fs.readFileSync(path.join(HERE, 'status-alat.js'), 'utf8') +
    '\nfunction ps(t,e){return __kantorStatusAlat(t,e)??Q?.formatToolStatus(t,e)??`Using ${t}`}',
}

// Jalur kedua: kalau hook pixel-agents ("Instant Detection") aktif, status dibuat di handlePreToolUse.
const STATUS_ALAT_HOOK = {
  nama: 'status kerja bahasa Indonesia (hook)',
  cari: 'i=this.provider.formatToolStatus(o,r),a=`hook-',
  ganti: 'i=__kantorStatusAlat(o,r)??this.provider.formatToolStatus(o,r),a=`hook-',
}

// Label status di atas karakter dalam bahasa Indonesia (`semua`: ganti setiap kemunculan).
const LABEL_SANTAI = { nama: 'label Idle', cari: 'return`Idle`}', ganti: 'return`Lagi santai`}' }
const LABEL_IZIN = { nama: 'label Needs approval', cari: '`Needs approval`', ganti: '`Menunggu izin Pak Ricko`', semua: true }
const LABEL_JAWABAN = { nama: 'label Waiting for input', cari: '`Waiting for input`', ganti: '`Menunggu jawaban`', semua: true }

const STATUS_TERIMA = {
  nama: 'terima kuota & izin',
  cari: 's.type===`kantorRapat`){',
  ganti: 's.type===`kantorStatus`){__kantorStatus(s,lo,nn)}else if(s.type===`kantorRapat`){',
}

const STATUS_FUNGSI = {
  nama: 'kuota & izin (fungsi)',
  cari: 'var oo=class{layout;',
  ganti: fs.readFileSync(path.join(HERE, 'status.js'), 'utf8') + '\nvar oo=class{layout;',
}

const RAPAT_TERIMA = {
  nama: 'terima status rapat',
  cari: 's.type===`areaMappingsLoaded`){',
  ganti: 's.type===`kantorRapat`){window.__kantorRapatData=s}else if(s.type===`areaMappingsLoaded`){',
}

// `lo` = ref ke OfficeState (lo.current): characters, seats, seatZone, reassignSeat, ...
const RAPAT_TAMPILAN = {
  nama: 'karakter berkumpul di ruang rapat',
  cari: 'var lo={current:null},U=new Pa;g&&co(lo);',
  ganti: 'var lo={current:null},U=new Pa;g&&co(lo);__kantorRapatMulai(lo);' +
    `window.__kantorProfil=${JSON.stringify(bacaProfil())};` + `
function __kantorRapatMulai(ref){
  if(typeof window==="undefined")return;
  window.__kantorOffice=ref;
  var asal=new Map(),dibungkus=false;
  function nama(ch){return String(ch&&ch.folderName||"").toLowerCase()}
  function ikut(ch){
    var r=window.__kantorRapatData;
    if(!r||!r.aktif||!ch||ch.isSubagent||!ch.folderName)return false;
    return !Array.isArray(r.peserta)||r.peserta.map(function(x){return String(x).toLowerCase()}).indexOf(nama(ch))>=0;
  }
  setInterval(function(){
    var os=ref.current;if(!os)return;
    if(!dibungkus){
      dibungkus=true;
      var asli=os.setAgentActive;
      os.setAgentActive=function(id,aktif){
        asli.call(this,id,aktif);
        var ch=this.characters.get(id);
        if(!aktif&&ikut(ch))ch.seatTimer=600;
      };
    }
    var r=window.__kantorRapatData,ruang=(r&&r.ruang)||"Ruang Rapat",pemimpin=String(r&&r.pemimpin||"").toLowerCase();
    var kepala=null;
    os.seats.forEach(function(s,id){
      if(os.seatZone(id)!==ruang)return;
      var k=kepala&&os.seats.get(kepala);
      if(!k||s.seatCol<k.seatCol||(s.seatCol===k.seatCol&&s.seatRow<k.seatRow))kepala=id;
    });
    var berubah=false;
    os.characters.forEach(function(ch){
      if(ch.isSubagent)return;
      var zona=ch.seatId?os.seatZone(ch.seatId):null;
      if(ikut(ch)){
        if(zona!==ruang){
          var bebas=[];
          os.seats.forEach(function(s,id){if(!s.assigned&&os.seatZone(id)===ruang)bebas.push(id)});
          var pilih=null;
          if(pemimpin&&nama(ch)===pemimpin&&bebas.indexOf(kepala)>=0)pilih=kepala;
          else{
            var lain=bebas.filter(function(id){return id!==kepala||!pemimpin});
            if(!lain.length)lain=bebas;
            if(lain.length)pilih=lain[Math.floor(Math.random()*lain.length)];
          }
          if(!pilih)return;
          if(!asal.has(ch.id))asal.set(ch.id,ch.seatId||null);
          os.reassignSeat(ch.id,pilih);
          if(!ch.isActive)ch.seatTimer=600;
          berubah=true;
        }else if(!ch.isActive){
          if(ch.state==="idle")os.sendToSeat(ch.id);
          else if(ch.state==="type"&&ch.seatTimer<300)ch.seatTimer=600;
        }
      }else{
        // Bukan peserta rapat: kembali dari rapat, atau pindahkan kalau duduk di luar ruangannya.
        var izin=os.areaMappings&&os.areaMappings[ch.folderName];
        var bolehDi=function(id){return !!id&&(!izin||!izin.length||izin.indexOf(os.seatZone(id))>=0)};
        var lama=asal.get(ch.id);asal.delete(ch.id);
        var dariRapat=lama!==undefined&&zona===ruang;
        if(!dariRapat&&!(ch.seatId&&zona!==null&&!bolehDi(ch.seatId)))return;
        var s=lama&&os.seats.get(lama);
        var tujuan=s&&!s.assigned&&bolehDi(lama)?lama:os.findFreeSeat(ch.folderName);
        if(!bolehDi(tujuan))return;
        os.reassignSeat(ch.id,tujuan);
        berubah=true;
      }
    });
    if(berubah){
      if(os.rebuildFurnitureInstances)os.rebuildFurnitureInstances();
      // Simpan kursi (bukan kursi rapat) supaya posisinya tetap saat Pixel Office dibuka lagi.
      if(!(r&&r.aktif)&&typeof Sa==="function")Sa(os);
    }
  },1500);
}
`,
}

// `a` = karakter yang sedang digambar labelnya, `E.jsx` = pembuat elemen React.
const PROFIL = 'window.__kantorProfil&&window.__kantorProfil[String(a.folderName).toLowerCase()]'
const SPAN_KECIL = 'className:`text-2xs leading-none overflow-hidden text-ellipsis block`'
const LABEL_JARAK = {
  nama: 'label lebih tinggi untuk baris jabatan',
  cari: 'top:g-(O?34:28)',
  ganti: 'top:g-(O?((' + PROFIL + ')?44:34):28)',
}
const LABEL_NAMA = {
  nama: 'label nama + jabatan',
  cari: 'a.folderName&&(0,E.jsx)(`span`,{' + SPAN_KECIL + ',children:a.folderName})',
  ganti:
    'a.folderName&&(0,E.jsx)(`span`,{' + SPAN_KECIL + ',style:{fontWeight:`bold`},' +
    'children:((' + PROFIL + ')||{}).nama||a.folderName}),' +
    'a.folderName&&(' + PROFIL + ')&&(0,E.jsx)(`span`,{' + SPAN_KECIL + ',style:{color:`#e3c08d`,marginTop:`2px`},' +
    'children:(' + PROFIL + ').jabatan})',
}

// Animasi ambien: bawaannya furnitur hanya beranimasi saat "menyala" (PC di depan karyawan yang
// bekerja). Grup animasi yang TIDAK berada di dalam state on/off (nama grupnya berakhiran `_`,
// mis. `ONSEN__`) dianggap animasi ambien: onsen, akuarium, lentera, dll. bergerak terus.
// `gn` = peta grup animasi -> id frame, `Un` = pembuat instance furnitur dari daftar layout.
const DETIK_PER_FRAME = 0.35
const AMBIEN_FUNGSI = {
  nama: 'animasi ambien + aktivitas karyawan (fungsi)',
  cari: 'var oo=class{layout;',
  ganti:
    fs.readFileSync(path.join(HERE, 'aktivitas.js'), 'utf8') + '\n' +
    'function __kantorAmbien(list,timer){var peta=new Map();' +
    'gn.forEach(function(ids,grup){if(/_$/.test(grup)&&ids.length>1)ids.forEach(function(id){peta.set(id,ids)})});' +
    'if(!peta.size)return list;' +
    `var langkah=Math.floor(timer/${DETIK_PER_FRAME});` +
    // Fase digeser per posisi supaya furnitur kembar (mis. pohon kelapa) tidak bergerak serempak.
    'return list.map(function(f){var ids=peta.get(f.type);if(!ids)return f;' +
    'var i=(langkah+f.col*7+f.row*3)%ids.length;return ids[i]===f.type?f:Object.assign({},f,{type:ids[i]})})}' +
    'var oo=class{layout;',
}
const AMBIEN_DIAM = {
  nama: 'animasi ambien (tanpa karyawan aktif)',
  cari: 'if(e.size===0){this.furniture=Un(this.layout.furniture);return}',
  ganti: 'if(e.size===0){this.furniture=Un(__kantorAmbien(this.layout.furniture,this.furnitureAnimTimer));return}',
}
const AMBIEN_AKTIF = {
  nama: 'animasi ambien (ada karyawan aktif)',
  cari: 'return n});this.furniture=Un(n)}',
  ganti: 'return n});this.furniture=Un(__kantorAmbien(n,this.furnitureAnimTimer))}',
}
// Aktivitas karyawan saat menganggur (lihat aktivitas.js): dijalankan sebelum logika bawaan
// karakter (`zi`) di OfficeState.update, dan menggambar pose + properti di renderer (`ua`:
// `l` = daftar gambar, `a` = zoom, `r`/`i` = geser kanvas).
const AKTIVITAS_GERAK = {
  nama: 'aktivitas karyawan (gerak)',
  cari: 'this.withOwnSeatUnblocked(t,()=>zi(t,e,this.walkableTiles,this.seats,this.tileMap,this.blockedTiles))',
  ganti: '(__kantorAktivitas(this,t,e)||this.withOwnSeatUnblocked(t,()=>zi(t,e,this.walkableTiles,this.seats,this.tileMap,this.blockedTiles)))',
}
const AKTIVITAS_GAMBAR = {
  nama: 'aktivitas karyawan (gambar)',
  cari: 'p=e.isHeadless&&ra?xe:1;if(e.matrixEffect)',
  ganti: 'p=e.isHeadless&&ra?xe:1;if(__kantorGambar(l,e,a,r,i))continue;if(e.matrixEffect)',
}

// Satpam kantor: "Watch All Sessions" menampilkan SEMUA sesi Claude Code di PC, termasuk sesi
// di folder lain (mis. label "intelligence"). Hanya karyawan di tools/karyawan.json + PROFIL_LAIN
// (Pak Ricko) yang dibuat karakternya. `a` = nama folder sesi.
const SATPAM = {
  nama: 'hanya karyawan kantor yang tampil',
  cari: 'addAgent(e,t,n,r,i,a,o){if(this.characters.has(e))return;',
  ganti: 'addAgent(e,t,n,r,i,a,o){if(this.characters.has(e))return;' +
    'if(a&&window.__kantorProfil&&!window.__kantorProfil[String(a).toLowerCase()])return;',
}

// Cahaya hangat (lihat cahaya.js): peta cahaya ditempel di renderer (`ba`) setelah lantai,
// dinding, furnitur, dan karakter (`ua`), sebelum gelembung status, supaya label tetap jernih.
// `e` = konteks kanvas, `S`/`C` = geser kanvas, `o` = zoom.
const CAHAYA_FUNGSI = {
  nama: 'cahaya hangat (fungsi)',
  cari: 'var oo=class{layout;',
  ganti: fs.readFileSync(path.join(HERE, 'cahaya.js'), 'utf8') + '\nvar oo=class{layout;',
}
const CAHAYA_GAMBAR = {
  nama: 'cahaya hangat (gambar)',
  cari: 'y??[]),va(e,a,S,C,o)',
  ganti: 'y??[]),__kantorCahaya(e,S,C,o),va(e,a,S,C,o)',
}

// Tema antarmuka hangat: arang kecokelatan + aksen matcha menggantikan ungu neon bawaan.
// Ditempel di akhir CSS, jadi menimpa variabel warna bawaan di :root.
const TEMA_CSS = '\n/* --kantor-tema: arang hangat + aksen matcha (Kantor Ricko) */\n:root{' + [
  '--color-bg:#262119', '--color-bg-dark:#1d1914', '--color-bg-thumb:#322b23', '--color-border:#5c4e3f',
  '--color-accent:#8a9a5b', '--color-accent-bright:#a8b86e', '--color-text:#f6eedfe6', '--color-text-muted:#f6eedf8c',
  '--color-btn-bg:#352e26', '--color-btn-hover:#4a4035', '--color-active-bg:#3f4a2c',
  '--color-status-active:#8cc4b5', '--color-status-permission:#d9a441', '--color-status-success:#a3b86c',
].join(';') + '}\n'

// Frame ke-2 dst. tidak ditampilkan sebagai furnitur terpisah di palet editor Layout.
const AMBIEN_PALET = {
  nama: 'sembunyikan frame animasi dari palet',
  cari: 't.state===`on`&&c.add(t.id);_n=t;',
  ganti: 't.state===`on`&&c.add(t.id);for(let t of e.catalog)t.animationGroup&&t.frame>0&&c.add(t.id);_n=t;',
}

function bundelTampilan(ekstensi = 'js') {
  const html = fs.readFileSync(path.join(DIST, 'webview', 'index.html'), 'utf8')
  const m = html.match(new RegExp(`assets/(index-[\\w-]+\\.${ekstensi})`))
  if (!m) throw new Error(`bundel tampilan (assets/index-*.${ekstensi}) tidak ditemukan di webview/index.html`)
  return path.join(DIST, 'webview', 'assets', m[1])
}

const TARGET = [
  { file: path.join(DIST, 'cli.js'), penanda: '__kantorKarakter', patches: [KARAKTER_TETAP, PULIHKAN_KARYAWAN, RAPAT_SERVER, STATUS_SERVER, STATUS_ALAT, STATUS_ALAT_HOOK] },
  { file: bundelTampilan(), penanda: '__kantorRapat', patches: [RAPAT_TERIMA, STATUS_TERIMA, RAPAT_TAMPILAN, LABEL_JARAK, LABEL_NAMA, AMBIEN_FUNGSI, AMBIEN_DIAM, AMBIEN_AKTIF, AMBIEN_PALET, AKTIVITAS_GERAK, AKTIVITAS_GAMBAR, SATPAM, CAHAYA_FUNGSI, CAHAYA_GAMBAR, STATUS_FUNGSI, LABEL_SANTAI, LABEL_IZIN, LABEL_JAWABAN] },
  { file: bundelTampilan('css'), penanda: '--kantor-tema', patches: [], tambahan: TEMA_CSS },
]

const versi = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version
const terpasang = []
for (const { file, penanda, patches, tambahan } of TARGET) {
  const asli = `${file}.asli`
  if (!fs.existsSync(asli)) {
    if (fs.readFileSync(file, 'utf8').includes(penanda)) {
      console.error(`${path.basename(file)} sudah ter-patch tapi salinan aslinya tidak ada. Pasang ulang: hapus node_modules\\pixel-agents lalu npm install.`)
      process.exit(1)
    }
    fs.copyFileSync(file, asli)
  }
  let js = fs.readFileSync(asli, 'utf8')
  for (const p of patches) {
    const jumlah = js.split(p.cari).length - 1
    if (p.semua ? jumlah < 1 : jumlah !== 1) {
      console.error(`pixel-agents ${versi}: titik patch "${p.nama}" ditemukan ${jumlah}x di ${path.basename(file)} (harus 1). Versi berubah? Patch dibatalkan.`)
      process.exit(1)
    }
    js = p.semua ? js.split(p.cari).join(p.ganti) : js.replace(p.cari, () => p.ganti)
  }
  if (tambahan) js += tambahan
  fs.writeFileSync(file, js)
  terpasang.push(...patches.map(p => p.nama), ...(tambahan ? ['tema warna hangat'] : []))
}
console.log(`pixel-agents ${versi}: ${terpasang.length} patch terpasang (${terpasang.join('; ')}).`)
