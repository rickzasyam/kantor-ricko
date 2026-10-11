// Furnitur kustom Kantor Ricko: digambar piksel demi piksel, lalu ditulis sebagai
// paket aset pixel-agents (assets/furniture/<ID>/manifest.json + PNG).
import fs from 'node:fs'
import path from 'node:path'
import { Spr } from './lib/sprite.mjs'
import { GENZ_ANIMASI, GENZ_ROTASI, GENZ_SINGLE, kursiKantorPastel } from './furnitur-genz.mjs'

const SHADOW = '#00000033'

// ---------------------------------------------------------------- Ruang kerja

/** Layar PC flat modern (16x32). `screen` menggambar isi layar di x 2..13, y 2..11. */
function pcFront(screen) {
  const s = new Spr(16, 32)
  s.rrect(1, 1, 14, 13, '#151821')          // bezel
  s.hl(2, 1, 12, '#2c3140')                  // pantulan tepi atas
  screen(s)
  s.hl(2, 12, 12, '#1d212b')                 // dagu layar
  s.px(13, 12, '#5ad1ff')                    // lampu power
  s.rect(7, 14, 2, 3, '#4a5060')             // leher stand
  s.rect(5, 17, 6, 1, '#363b47')             // kaki stand
  s.hl(5, 18, 6, SHADOW)
  s.rect(2, 20, 10, 2, '#e9edf2')            // keyboard
  s.hl(2, 22, 10, '#a9b1be')
  for (let x = 3; x < 11; x += 2) s.px(x, 20, '#c3cad6').px(x + 1, 21, '#c3cad6')
  s.rrect(13, 20, 2, 3, '#e9edf2').px(13, 22, '#a9b1be')   // mouse
  return s
}

const CODE = [
  [0, 5, '#7fdbca'], [1, 7, '#c792ea'], [1, 4, '#ffcb6b'], [0, 8, '#82aaff'],
  [2, 6, '#c3e88d'], [2, 3, '#f78c6c'], [1, 9, '#7fdbca'], [0, 4, '#c792ea'],
]
function codeScreen(offset) {
  return s => {
    s.rect(2, 2, 12, 10, '#0f1622')
    for (let row = 0; row < 5; row++) {
      const [indent, len, color] = CODE[(row + offset) % CODE.length]
      s.hl(3 + indent, 3 + row * 2, Math.min(len, 10 - indent), color)
    }
    s.px(3 + (offset % 3) * 2, 11, '#ffffff')   // kursor berkedip
  }
}
function offScreen(s) {
  s.rect(2, 2, 12, 10, '#0b0e14')
  s.line(4, 10, 11, 3, '#1b2231').line(5, 10, 12, 3, '#161c28')
}

function pcBack() {
  const s = new Spr(16, 32)
  s.rrect(1, 1, 14, 13, '#2b303c')
  s.rect(2, 2, 12, 11, '#363c4a')
  s.hl(2, 2, 12, '#454c5d')
  s.oval(7.5, 6.5, 1.5, 1.5, '#c9ced8')      // logo
  for (let y = 9; y < 12; y++) s.hl(4, y, 8, y % 2 ? '#2b303c' : '#363c4a')   // ventilasi
  s.rect(7, 14, 2, 3, '#4a5060')
  s.rect(5, 17, 6, 1, '#363b47')
  s.hl(5, 18, 6, SHADOW)
  return s
}

function pcSide() {
  const s = new Spr(16, 32)
  s.rect(9, 1, 3, 13, '#1d212b')
  s.vl(9, 1, 13, '#2c3140')
  s.rect(10, 14, 2, 3, '#4a5060')
  s.rect(7, 17, 7, 1, '#363b47')
  s.hl(7, 18, 7, SHADOW)
  s.rect(2, 20, 5, 2, '#e9edf2').hl(2, 22, 5, '#a9b1be')
  return s
}

function modernDesk() {
  const s = new Spr(48, 32)
  s.rect(1, 10, 46, 15, '#f4f1ea')                       // permukaan meja
  s.hl(1, 10, 46, '#ffffff')
  s.vl(1, 11, 14, '#e8e2d6').vl(46, 11, 14, '#e8e2d6')
  for (const y of [14, 19]) s.hl(3, y, 42, '#efebe2')    // serat halus
  s.hl(1, 24, 46, '#ddd6c8')
  s.rect(1, 25, 46, 2, '#c9c1b2')                        // sisi depan
  s.hl(1, 27, 46, '#9c9486')
  s.rect(5, 28, 38, 3, '#00000022')                      // bayangan
  s.rect(30, 27, 13, 4, '#d8d1c4').hl(35, 29, 3, '#9c9486')   // laci
  s.rect(3, 27, 2, 4, '#4b5160').rect(43, 27, 2, 4, '#4b5160')
  s.hl(2, 31, 4, '#2d313b').hl(42, 31, 4, '#2d313b')
  return s
}

// ----------------------------------------------------- Ruang Ricko & Pak Asep

// Meja & kursi pimpinan versi gen-Z: meja kayu oak terang + panel krem, lampu LED ungu di
// bawah meja, keyboard mekanik warna-warni; kursi ergonomis hitam-lilac.
function execDesk() {
  const s = new Spr(64, 32)
  s.rect(1, 9, 62, 15, '#e3b47a')                         // permukaan oak terang
  s.hl(1, 9, 62, '#f3cf9b')
  s.vl(1, 10, 14, '#c99558').vl(62, 10, 14, '#c99558')
  for (const y of [13, 18]) s.hl(3, y, 58, '#dcab70')
  s.rect(17, 12, 30, 9, '#3a3058').frame(17, 12, 30, 9, '#4b3f7a')   // desk mat
  for (let i = 0; i < 8; i++) s.px(20 + i * 3, 18, ['#ff6b81', '#ffd166', '#5fe0b0', '#7cc6ff'][i % 4]).px(21 + i * 3, 18, '#e9edf2')  // keyboard
  s.rect(49, 13, 7, 6, '#fff6e5').hl(50, 15, 5, '#c9c2b4').hl(50, 17, 4, '#c9c2b4')
  s.oval(9, 15, 3, 2, '#4fbf6f').rect(8, 16, 3, 3, '#ff8fd0')       // sukulen di pot pink
  s.hl(1, 23, 62, '#c99558')
  s.rect(1, 24, 62, 5, '#fff6e5')                         // panel depan krem
  s.hl(1, 24, 62, '#ffd166')
  for (const x of [20, 43]) s.vl(x, 25, 4, '#e8dcc6')
  s.hl(1, 29, 62, '#b79cff').hl(2, 30, 60, '#b79cff66')  // LED ungu
  s.hl(2, 31, 60, SHADOW)
  return s
}

const LEATHER = '#2b2540'
function execChairFront() {
  const s = new Spr(16, 16)
  s.rrect(3, 0, 10, 9, LEATHER).hl(4, 0, 8, '#4b3f7a')
  s.vl(5, 1, 7, '#b79cff').vl(10, 1, 7, '#b79cff')
  s.rect(2, 8, 12, 4, '#3a3058').hl(2, 8, 12, '#5a4b8a')
  s.rect(1, 6, 2, 6, '#1d1830').rect(13, 6, 2, 6, '#1d1830')
  s.rect(7, 12, 2, 2, '#9aa2ae')
  s.hl(3, 14, 10, '#1d2029')
  for (const x of [3, 7, 12]) s.px(x, 15, '#111318')
  return s
}
function execChairBack() {
  const s = new Spr(16, 16)
  s.rrect(3, 0, 10, 10, '#241f38').hl(4, 0, 8, '#3a3058')
  s.vl(5, 1, 8, '#b79cff').vl(10, 1, 8, '#b79cff')
  s.rect(1, 6, 2, 5, '#1d1830').rect(13, 6, 2, 5, '#1d1830')
  s.rect(2, 10, 12, 2, LEATHER)
  s.rect(7, 12, 2, 2, '#9aa2ae')
  s.hl(3, 14, 10, '#1d2029')
  for (const x of [3, 7, 12]) s.px(x, 15, '#111318')
  return s
}
function execChairSide() {
  const s = new Spr(16, 16)
  s.rect(2, 0, 3, 10, LEATHER).vl(2, 0, 10, '#4b3f7a').vl(3, 1, 8, '#b79cff')
  s.rect(3, 8, 10, 3, '#3a3058').hl(3, 8, 10, '#5a4b8a')
  s.rect(5, 6, 7, 2, '#1d1830')
  s.rect(7, 11, 2, 3, '#9aa2ae')
  s.hl(3, 14, 10, '#1d2029').px(3, 15, '#111318').px(12, 15, '#111318')
  return s
}

function aquarium(f = 0) {
  const s = new Spr(32, 32)
  s.rect(1, 3, 30, 2, '#2b2b33').hl(2, 4, 28, '#fff6c2')       // tutup + lampu
  s.rect(1, 5, 30, 15, '#1d1d22')
  s.rect(2, 5, 28, 14, '#4fb3e8')
  s.rect(2, 5, 28, 3, '#6cc4ef')
  s.rect(2, 16, 28, 3, '#e6d3a3').hl(2, 16, 28, '#f0e2bd')     // pasir
  const goyang = [0, 1, 0, -1][f % 4]
  for (const x of [5, 6, 24, 25, 26]) {
    const y0 = 11 + (x % 3)
    s.vl(x, y0 + 2, 4 - (x % 3), x % 2 ? '#3fbf6f' : '#2f9e5a').vl(x + goyang, y0, 2, x % 2 ? '#3fbf6f' : '#2f9e5a')
  }
  const ikan1 = [9, 11, 13, 11][f % 4]
  s.rect(ikan1, 9, 4, 2, '#ff8c42').px(ikan1 - 1, 9 + (f % 2), '#ff8c42').px(ikan1 + 4, 10, '#ffb27a').px(ikan1 + 3, 9, '#ffffff')
  const ikan2 = [18, 16, 14, 16][f % 4]
  s.rect(ikan2, 13, 3, 2, '#ffd93d').px(ikan2 + 3, 13 + (f % 2), '#ffd93d').px(ikan2 - 1, 14, '#ffe680')
  for (const [x, y] of [[22, 13], [23, 10], [21, 7]]) s.px(x + (f % 2), 6 + ((y - 6 - f * 2 + 40) % 10), '#d8f3ff')
  s.vl(2, 5, 14, '#9fd8f5')                                    // kilau kaca
  s.rect(1, 20, 30, 11, '#2b2b33').hl(1, 20, 30, '#3a3a44')
  s.vl(16, 21, 9, '#1f1f26').hl(13, 25, 2, '#b8bec8').hl(18, 25, 2, '#b8bec8')
  s.hl(2, 31, 28, SHADOW)
  return s
}

// ----------------------------------------------------------------- Ruang rapat

function meetingTable() {
  const s = new Spr(96, 32)
  s.rrect(2, 3, 92, 20, '#2f1c13')
  s.rrect(3, 4, 90, 18, '#4a2c1d')
  s.rect(5, 6, 86, 14, '#5a3524')
  s.hl(8, 7, 40, '#7a4a33').hl(52, 8, 30, '#6e4430')            // kilap
  s.rect(28, 11, 40, 4, '#b38a3a').hl(28, 11, 40, '#c9a24a')     // taplak emas
  for (const x of [12, 30, 48, 66, 82]) s.rect(x, 7, 4, 3, '#f3efe6')        // notes sisi atas
  for (const x of [14, 32, 50, 68, 84]) s.rect(x, 16, 4, 3, '#f3efe6')       // notes sisi bawah
  for (const x of [18, 38, 58, 78]) s.rect(x, 8, 2, 2, '#bfe6ff').rect(x + 2, 17, 2, 2, '#bfe6ff')  // gelas
  s.oval(47.5, 12.5, 2, 1.5, '#3fbf6f')                          // tanaman meja
  s.rect(4, 22, 88, 3, '#2f1c13').hl(4, 22, 88, '#3b2418')
  s.rect(20, 25, 6, 5, '#24150e').rect(70, 25, 6, 5, '#24150e')
  s.rect(10, 29, 76, 2, SHADOW)
  return s
}

function tvFrame() {
  const s = new Spr(48, 32)
  s.rrect(1, 3, 46, 24, '#121418')
  s.hl(2, 3, 44, '#2a2d33')
  s.hl(3, 27, 42, '#00000040')
  return s
}

function presentationTv() {
  const s = tvFrame()
  s.rect(3, 5, 42, 20, '#0e1a2e')
  s.rect(5, 6, 16, 2, '#2b6cb0').hl(23, 7, 8, '#4a5a78')        // judul slide
  s.vl(7, 10, 13, '#3a4a66').hl(7, 22, 34, '#3a4a66')            // sumbu
  const bars = [[9, 5, '#4fd1c5'], [14, 8, '#63b3ed'], [19, 6, '#f6ad55'], [24, 10, '#fc8181'], [29, 12, '#b794f4']]
  for (const [x, h, c] of bars) s.rect(x, 22 - h, 3, h, c)
  s.line(9, 18, 15, 15, '#ffffff').line(15, 15, 21, 16, '#ffffff').line(21, 16, 27, 12, '#ffffff').line(27, 12, 32, 10, '#ffffff')
  s.oval(39, 15, 4, 4, '#f6ad55').oval(39, 15, 2, 2, '#0e1a2e')  // donat chart
  return s
}

function gameTv(f = 0) {
  const s = tvFrame()
  for (let y = 5; y < 18; y++) s.hl(3, y, 42, y < 11 ? '#5fb4ff' : '#8fcbff')
  s.oval(11, 8, 3, 1.5, '#ffffff').oval(33, 7, 4, 1.5, '#ffffff')    // awan
  s.rect(3, 18, 42, 2, '#4caf50').rect(3, 20, 42, 5, '#8d5a3b')
  for (let x = 4; x < 44; x += 6) s.px(x, 22, '#a8714b')
  s.rect(26, 12, 8, 2, '#c8643b').hl(26, 12, 8, '#e08458')           // platform bata
  const hx = 12 + [0, 2, 4, 2][f % 4], lompat = f % 4 === 2 ? 2 : 0
  s.rect(hx, 13 - lompat, 3, 3, '#e53e3e').rect(hx, 16 - lompat, 3, 2, '#3b5bdb').px(hx + 1, 12 - lompat, '#f5c99b')   // hero
  if (f % 2) s.vl(30, 8, 3, '#ffd93d')                                 // koin berputar
  else s.oval(30, 9, 1, 1, '#ffd93d')
  s.hl(5, 6, 6, '#ffffff').hl(36, 6, 6, '#ffd93d')                    // HUD
  return s
}

// ----------------------------------------------------------------------- Pantry

function kitchenCounter() {
  const s = new Spr(64, 32)
  s.rect(1, 2, 62, 7, '#eef2f5')                                   // backsplash subway
  for (let y = 2; y < 9; y += 3) s.hl(1, y, 62, '#cfd6dd')
  for (let x = 4; x < 62; x += 8) s.vl(x + ((Math.floor(x / 8) % 2) * 4), 3, 2, '#cfd6dd')
  s.rect(1, 9, 62, 7, '#e7e2d8').hl(1, 9, 62, '#f7f4ee').hl(1, 15, 62, '#bdb6a8')   // meja batu
  s.rect(38, 10, 15, 5, '#9aa6b2').rect(39, 11, 13, 3, '#7d8995')   // wastafel
  s.rect(44, 5, 2, 6, '#a7b1bc').hl(44, 5, 4, '#a7b1bc')           // keran
  s.rect(8, 11, 9, 3, '#c9955c').hl(8, 11, 9, '#dcae78')           // talenan
  s.rect(1, 16, 62, 14, '#5b8a72')                                  // kabinet sage
  for (let x = 1; x < 63; x += 15.5) s.frame(Math.round(x) + 1, 17, 14, 12, '#4a735e')
  for (const x of [13, 18, 44, 49]) s.vl(x, 21, 3, '#d9dee3')
  s.rect(1, 30, 62, 2, '#2f3b35')
  return s
}

function coffeeMachine() {
  const s = new Spr(16, 32)
  s.rect(2, 0, 12, 3, '#3a3a40').hl(3, 0, 10, '#4c4c54')
  s.rect(3, 1, 4, 2, '#6b4a2e')                                     // biji kopi
  s.rect(2, 3, 12, 11, '#2a2a2f')
  s.rect(4, 4, 8, 4, '#c3c9cf').hl(4, 4, 8, '#e3e7ea')
  s.px(11, 2, '#ff4d4d')
  s.rect(7, 8, 2, 2, '#888c92')
  s.rect(6, 10, 4, 3, '#ffffff').hl(6, 10, 4, '#6b4226')            // cangkir
  s.hl(2, 14, 12, SHADOW)
  return s
}

function fridge() {
  const s = new Spr(16, 48)
  s.rrect(1, 1, 14, 45, '#d9dee4')
  s.rect(2, 1, 12, 2, '#eef1f4')
  s.rect(12, 2, 2, 43, '#c3cad2')
  s.hl(1, 17, 14, '#a9b1bb')
  s.rect(11, 6, 1, 7, '#8a929c').rect(11, 21, 1, 10, '#8a929c')
  s.rect(3, 7, 2, 2, '#ff6b6b').rect(5, 10, 2, 2, '#ffd93d').rect(3, 23, 3, 2, '#6bcbff')
  s.rect(4, 26, 4, 3, '#ffffff').hl(4, 28, 4, '#c9c2b4')           // memo
  s.hl(1, 46, 14, SHADOW)
  return s
}

function waterDispenser() {
  const s = new Spr(16, 32)
  s.rrect(4, 1, 8, 10, '#8fd3ffb0').vl(5, 2, 8, '#d6f0ffcc')
  s.rect(5, 10, 6, 2, '#4aa3df')
  s.rect(3, 12, 10, 18, '#f3f5f7').rect(11, 12, 2, 18, '#d5dbe1').hl(3, 12, 10, '#ffffff')
  s.rect(4, 15, 8, 4, '#e3e8ed')
  s.px(5, 16, '#e74c3c').px(10, 16, '#3498db')
  s.rect(5, 19, 6, 2, '#9aa4ae')
  s.hl(3, 30, 10, SHADOW)
  return s
}

// --------------------------------------------------------------------- Ruang game

function tvConsole() {
  const s = new Spr(48, 16)
  s.rect(1, 5, 46, 10, '#2b2340').rect(1, 5, 46, 2, '#3a3058')
  s.hl(1, 13, 46, '#b26bff').hl(1, 14, 46, '#b26bff55')             // LED ungu
  s.frame(4, 8, 18, 4, '#221b33').frame(26, 8, 18, 4, '#221b33')
  s.rect(6, 0, 6, 10, '#f2f2f5').rect(8, 1, 2, 8, '#1b1b22')        // konsol
  s.px(7, 0, '#d9d9e0').px(10, 0, '#d9d9e0')
  s.rect(28, 3, 7, 3, '#f2f2f5').rect(30, 3, 3, 1, '#2a2a33').px(28, 5, '#d9d9e0').px(34, 5, '#d9d9e0')  // stik
  s.rect(38, 2, 2, 4, '#3b5bdb').rect(40, 2, 2, 4, '#e53e3e').rect(42, 3, 2, 3, '#2f9e44')   // kaset game
  return s
}

function gamingChairBack() {
  const s = new Spr(16, 16)
  s.rrect(3, 0, 10, 11, '#1c1c24')
  s.vl(4, 1, 9, '#e53e3e').vl(11, 1, 9, '#e53e3e')
  s.rect(6, 1, 4, 2, '#e53e3e').hl(6, 1, 4, '#ff6b6b')
  s.rect(1, 7, 2, 4, '#26262f').rect(13, 7, 2, 4, '#26262f')
  s.rect(2, 10, 12, 2, '#24242e')
  s.rect(7, 12, 2, 2, '#7c8494')
  s.hl(3, 14, 10, '#1d2029')
  for (const x of [3, 7, 12]) s.px(x, 15, '#111318')
  return s
}

function arcadeMachine(f = 0) {
  const s = new Spr(16, 32)
  s.rect(1, 1, 14, 31, '#3b2a7a').rect(13, 1, 2, 31, '#2d2060')
  s.rect(2, 2, 11, 4, '#ff4fd8').hl(2, 2, 11, '#ff9bea')            // papan nama
  s.rect(3, 7, 9, 9, '#0b1020')
  const invader = ['.x..x.', '.xxxx.', 'xx.xxx', 'xxxxxx', '.x..x.']
  s.pattern(3 + [0, 1, 2, 1][f % 4], 9, invader, { x: '#7cff6b' })
  s.vl(7, 15 - (f % 4) * 2, 1, '#ffd93d')                              // peluru
  s.hl(4, 7, 3, '#ffffff').hl(9, 7, 2, '#ffd93d')
  s.rect(2, 17, 11, 4, '#2b1f5c').hl(2, 17, 11, '#3d2d7a')
  s.vl(5, 16, 2, '#cfcfcf').px(5, 15, '#ff3b3b')                     // joystick
  s.px(9, 19, '#ffd93d').px(11, 19, '#4fd1c5').px(10, 18, '#ff6b6b')
  s.rect(6, 23, 3, 3, '#22184a').vl(7, 23, 3, '#ffcc00')            // koin
  s.rect(2, 28, 11, 4, '#22184a')
  return s
}

function billiardTable() {
  const s = new Spr(64, 48)
  s.rrect(1, 4, 62, 34, '#6b3a22')
  s.hl(2, 4, 60, '#8a5030')
  s.rect(5, 8, 54, 26, '#1f8a50')
  s.frame(5, 8, 54, 26, '#187040')
  for (const [x, y] of [[4, 7], [31, 6], [58, 7], [4, 33], [31, 34], [58, 33]]) s.rect(x, y, 3, 3, '#111111')
  for (const x of [17, 45]) s.px(x, 5, '#f0e6c8').px(x, 36, '#f0e6c8')
  const balls = [[44, 20, '#ffd93d'], [47, 18, '#3b5bdb'], [47, 22, '#e53e3e'], [50, 16, '#7b2cbf'], [50, 20, '#111111'], [50, 24, '#ff8c42'], [53, 18, '#2f9e44'], [53, 22, '#8b1e1e']]
  for (const [x, y, c] of balls) s.rect(x, y, 2, 2, c).px(x, y, '#ffffff88')
  s.rect(16, 20, 2, 2, '#ffffff')                                    // bola putih
  s.line(5, 30, 15, 22, '#e2c38f').px(15, 22, '#3a7bd5')            // stik
  s.rect(1, 38, 62, 4, '#5a2f1b').hl(1, 38, 62, '#6b3a22')
  s.rect(4, 42, 5, 5, '#4a2616').rect(55, 42, 5, 5, '#4a2616')
  s.rect(9, 43, 46, 3, SHADOW)
  return s
}

function neonSign(f = 0) {
  const s = new Spr(32, 32)
  s.rrect(1, 4, 30, 24, '#1a1430')
  const pad = [
    '..xxxxxxxxxxxxxx..',
    '.x..............x.',
    'x...x........o...x',
    'x..xxx......o.o..x',
    'x...x........o...x',
    'x.......xx.......x',
    '.x....xx..xx....x.',
    '..xxxx......xxxx..',
  ]
  const a = ['40', '66', '40', '22'][f % 4]
  const glow = `#4ff6ff${a}`
  const magenta = f % 4 === 3 ? '#7a2a68' : '#ff4fd8'                // tombol "o" sesekali padam
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.pattern(7 + dx, 9 + dy, pad, { x: glow, o: f % 4 === 3 ? null : `#ff4fd8${a}` })
  s.pattern(7, 9, pad, { x: '#4ff6ff', o: magenta })
  s.hl(9, 21, 14, '#ff4fd8').hl(9, 22, 14, `#ff4fd8${a}`)            // garis neon
  return s
}

function beanBag() {
  const s = new Spr(16, 16)
  s.oval(8, 10, 7, 5, '#d85f2a')
  s.oval(8, 9.5, 6.5, 4.5, '#ff7a3d')
  s.oval(6, 8, 3, 2, '#ff9d6b')
  s.oval(9, 10, 2, 1, '#e96a33')
  s.hl(3, 15, 10, SHADOW)
  return s
}

// ------------------------------------------------------------------ Kolam renang

// Kolam beranimasi (FRAME_KOLAM frame, berulang mulus): pola kilau dasar kolam (caustic)
// bergerak, riak putih bergeser, pelampung naik-turun, kilau matahari berkedip.
const FRAME_KOLAM = 8
const AIR = ['#1670b0', '#1d86c0', '#2394cc', '#2aa3d6', '#37b0e0']

function swimmingPool(f = 0) {
  const s = new Spr(160, 80)
  const t = (2 * Math.PI * f) / FRAME_KOLAM
  // Pinggiran batu (coping) + nat ubin
  s.rrect(0, 0, 160, 80, '#efe9dc')
  s.hl(1, 0, 158, '#fbf8f0').hl(1, 79, 158, '#d6cebd')
  for (let x = 8; x < 160; x += 8) s.vl(x, 1, 3, '#ddd5c5').vl(x, 76, 3, '#ddd5c5')
  for (let y = 8; y < 80; y += 8) s.hl(1, y, 3, '#ddd5c5').hl(156, y, 3, '#ddd5c5')
  s.frame(4, 4, 152, 72, '#c9c0ae')                                   // bibir kolam
  // Air: makin dalam makin gelap (ujung kanan = bagian dalam)
  const X0 = 6, Y0 = 6, W = 148, H = 68
  for (let y = Y0; y < Y0 + H; y++) for (let x = X0; x < X0 + W; x++) {
    const dalam = (x - X0) / W * 0.7 + (y - Y0) / H * 0.3
    s.px(x, y, AIR[4 - Math.min(4, Math.floor(dalam * 4.2 + 0.6))])
  }
  // Garis lintasan di dasar kolam
  for (const y of [22, 39, 56]) {
    s.hl(22, y, 116, '#1a74ad').hl(22, y + 1, 116, '#1a74ad')
    s.vl(20, y - 2, 6, '#1a74ad').vl(139, y - 2, 6, '#1a74ad')
  }
  // Caustic: tiga gelombang sinus; tiap suku waktu kelipatan bulat t supaya putaran mulus.
  for (let y = Y0 + 2; y < Y0 + H; y++) for (let x = X0 + 2; x < X0 + W; x++) {
    const v = Math.sin(0.31 * x + 0.17 * y + t) + Math.sin(-0.21 * x + 0.36 * y + 2 * t) + Math.sin(0.14 * x - 0.29 * y - t)
    if (v > 2.35) s.px(x, y, '#9be3f8')
    else if (v > 1.85) s.px(x, y, '#5cc6ec88')
  }
  // Bayangan dinding kolam (cahaya dari kanan-bawah)
  s.rect(X0, Y0, W, 2, '#0f5f9a').rect(X0, Y0, 2, H, '#0f5f9a')
  s.hl(X0 + 2, Y0 + 2, W - 2, '#1670b088').vl(X0 + 2, Y0 + 2, H - 2, '#1670b088')
  // Riak putih: pola berjarak 24 px, bergeser 3 px per frame (24 / 8 frame = putaran mulus).
  for (let row = 0; row < 5; row++) {
    const y = Y0 + 9 + row * 13
    for (let k = -1; k < 8; k++) {
      const x = X0 + 4 + k * 24 + (row % 2) * 12 + ((f * 3) % 24)
      if (x < X0 + 3 || x + 8 > X0 + W - 1) continue
      s.hl(x, y, 2, '#c8f1ff').hl(x + 2, y - 1, 3, '#ffffff').hl(x + 5, y, 2, '#c8f1ff')
    }
  }
  // Kilau matahari berkedip
  for (let i = 0; i < 7; i++) {
    const x = X0 + 10 + ((i * 53 + f * 29) % (W - 20))
    const y = Y0 + 6 + ((i * 31 + f * 17) % (H - 12))
    s.px(x, y, '#ffffff').px(x - 1, y, '#ffffff99').px(x + 1, y, '#ffffff99')
  }
  // Tangga
  for (const x of [138, 146]) s.rect(x, 1, 2, 18, '#c9d1d9').vl(x, 1, 18, '#eef2f5')
  for (const y of [9, 13, 17]) s.hl(138, y, 10, '#aeb7c0')
  // Pelampung naik-turun + riak lingkaran yang melebar
  const bob = Math.round(Math.sin(t) * 1.2)
  const rx = 9 + (f % 4), ry = 6 + Math.floor((f % 4) * 0.7)
  for (let a = 0; a < 40; a++) {
    const sudut = (a / 40) * 2 * Math.PI
    s.px(46 + Math.cos(sudut) * rx, 45 + Math.sin(sudut) * ry, f % 4 === 3 ? '#c8f1ff55' : '#c8f1ffaa')
  }
  s.oval(46, 46 + bob, 7, 5, '#00000030')
  s.oval(46, 44 + bob, 7, 5, '#ff5a5f')
  for (const [x, y] of [[40, 44], [52, 44], [46, 40], [46, 48]]) s.rect(x, y + bob, 2, 1, '#ffffff')
  s.oval(46, 44 + bob, 3, 2, '#2394cc')
  s.hl(43, 40 + bob, 3, '#ff9a9d')
  return s
}

function sunLounger() {
  const s = new Spr(16, 32)
  s.rrect(3, 2, 10, 27, '#f2f2f2').frame(3, 2, 10, 27, '#c8c8c8')
  for (let y = 4; y < 27; y += 3) s.hl(4, y, 8, '#4aa3df')
  s.rect(4, 3, 8, 6, '#eaeaea').hl(4, 8, 8, '#bdbdbd')               // sandaran
  s.rect(4, 21, 8, 4, '#ff8a65').hl(4, 21, 8, '#ffab91')              // handuk
  for (const [x, y] of [[3, 29], [12, 29], [3, 10], [12, 10]]) s.px(x, y, '#9e9e9e')
  s.hl(4, 31, 9, SHADOW)
  return s
}

function beachUmbrella() {
  const s = new Spr(32, 48)
  s.oval(16, 44, 9, 2, '#00000025')
  for (let y = 2; y < 18; y++) {
    const half = Math.round(Math.min(15, 3 + (y - 2) * 1.2))
    for (let x = 16 - half; x < 16 + half; x++) s.px(x, y, Math.floor((x - 16 + 32) / 4) % 2 ? '#ff5a5f' : '#ffffff')
  }
  for (let x = 1; x < 31; x += 4) s.px(x, 18, '#ff5a5f').px(x + 1, 18, '#ff5a5f')
  s.hl(2, 17, 28, '#d94a4f88')
  s.rect(15, 18, 2, 26, '#e8e2d6').vl(15, 18, 26, '#ffffff')
  s.oval(16, 44.5, 3, 1.5, '#9aa4ae')
  return s
}

function palmTree(f = 0) {
  const s = new Spr(32, 64)
  s.oval(16, 61, 8, 2, '#00000025')
  for (let y = 22; y < 62; y++) {
    const x = Math.round(15 + Math.sin((y - 22) / 12) * 2)
    s.hl(x, y, 3, y % 4 < 2 ? '#8a6a45' : '#a3814f').px(x, y, '#6f5436')
  }
  // Pelepah melengkung ke bawah: makin ke ujung makin tipis.
  const fronds = [[-14, 2], [-12, -7], [-5, -13], [4, -13], [11, -8], [14, 2], [8, 7], [-8, 7]]
  for (const [dx, dy] of fronds) {
    const vertical = Math.abs(dy) > Math.abs(dx)
    for (let i = 0; i <= 14; i++) {
      const t = i / 14
      const x = 16 + dx * t
      const angin = [0, 1, 1.5, 1][f % 4] * t * t
      const y = 17 + dy * t + 7 * t * t + (vertical ? 0 : angin * 0.5)
      const xa = x + angin
      const w = Math.round(2.2 * (1 - t)) + 1
      for (let k = -w; k <= w; k++) {
        s.px(xa + (vertical ? k : 0), y + (vertical ? 0 : k), k === -w ? '#5ad67c' : k === w ? '#25803f' : '#34a853')
      }
    }
  }
  s.oval(16, 17, 3, 2, '#2f9e4f')
  s.rect(14, 20, 2, 2, '#6b4a2e').rect(17, 21, 2, 2, '#5a3d25')       // kelapa
  return s
}

// ----------------------------------------------------------------- Daftar item

/** id, nama, kategori, sprite, footprint (tile), baris latar, opsi penempatan */
const SINGLE = [
  ['MODERN_DESK', 'Meja Modern', 'desks', modernDesk, 3, 2, 1],
  ['OFFICE_CHAIR', 'Kursi Kantor', 'chairs', kursiKantorPastel, 1, 1, 0],
  ['EXEC_DESK', 'Meja Eksekutif', 'desks', execDesk, 4, 2, 1],
  ['MEETING_TABLE', 'Meja Rapat', 'desks', meetingTable, 6, 2, 0],
  ['PRESENTATION_TV', 'TV Presentasi', 'wall', presentationTv, 3, 2, 0, { walls: true }],
  ['KITCHEN_COUNTER', 'Kitchen Set', 'desks', kitchenCounter, 4, 2, 1],
  ['COFFEE_MACHINE', 'Mesin Kopi', 'misc', coffeeMachine, 1, 2, 1, { surfaces: true }],
  ['FRIDGE', 'Kulkas', 'storage', fridge, 1, 3, 2],
  ['WATER_DISPENSER', 'Dispenser Air', 'misc', waterDispenser, 1, 2, 1],
  ['TV_CONSOLE', 'Meja PS5', 'desks', tvConsole, 3, 1, 0],
  ['GAMING_CHAIR', 'Kursi Gaming', 'chairs', gamingChairBack, 1, 1, 0],
  ['BILLIARD_TABLE', 'Meja Biliar', 'misc', billiardTable, 4, 3, 1],
  ['BEAN_BAG', 'Bean Bag', 'decor', beanBag, 1, 1, 0],
  ['SUN_LOUNGER', 'Kursi Berjemur', 'decor', sunLounger, 1, 2, 0],
  ['BEACH_UMBRELLA', 'Payung Pantai', 'decor', beachUmbrella, 2, 3, 2],
  ...GENZ_SINGLE,
]

/**
 * Furnitur beranimasi terus (animasi ambien, lihat patch-pixel-agents.mjs): id, nama, kategori,
 * fungsi gambar(frame), jumlah frame, footprint, baris latar, opsi. Frame pertama memakai id
 * lama supaya denah yang sudah ada (termasuk hasil editor Layout) tetap cocok.
 */
const ANIMASI = [
  ['SWIMMING_POOL', 'Kolam Renang', 'misc', swimmingPool, FRAME_KOLAM, 10, 5, 0],
  ['AQUARIUM', 'Akuarium', 'decor', aquarium, 4, 2, 2, 1],
  ['GAME_TV', 'TV Game', 'wall', gameTv, 4, 3, 2, 0, { walls: true }],
  ['ARCADE_MACHINE', 'Mesin Arcade', 'misc', arcadeMachine, 4, 1, 2, 1],
  ['NEON_SIGN', 'Neon Game', 'wall', neonSign, 4, 2, 2, 0, { walls: true }],
  ['PALM_TREE', 'Pohon Kelapa', 'decor', palmTree, 4, 2, 4, 3],
  ...GENZ_ANIMASI,
]

function asset(id, spr, fw, fh, extra = {}) {
  return { type: 'asset', id, file: `${id}.png`, width: spr.w, height: spr.h, footprintW: fw, footprintH: fh, ...extra }
}

export function buildFurniture(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true })
  const ids = []

  for (const [id, name, category, draw, fw, fh, bg, opt = {}] of SINGLE) {
    const dir = path.join(outDir, id)
    const spr = draw()
    spr.save(path.join(dir, `${id}.png`))
    const manifest = {
      id, name, category, type: 'asset',
      canPlaceOnWalls: !!opt.walls, canPlaceOnSurfaces: !!opt.surfaces, backgroundTiles: bg,
      width: spr.w, height: spr.h, footprintW: fw, footprintH: fh,
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    ids.push(id)
  }

  for (const [id, name, category, draw, n, fw, fh, bg, opt = {}] of ANIMASI) {
    const dir = path.join(outDir, id)
    const frames = Array.from({ length: n }, (_, i) => [i ? `${id}_ANIM_${i + 1}` : id, draw(i)])
    for (const [nama, spr] of frames) spr.save(path.join(dir, `${nama}.png`))
    const s = frames[0][1]
    const manifest = {
      id, name, category, type: 'group', groupType: 'animation',
      canPlaceOnWalls: !!opt.walls, canPlaceOnSurfaces: !!opt.surfaces, backgroundTiles: bg,
      members: frames.map(([nama], i) => asset(nama, s, fw, fh, { frame: i })),
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    ids.push(id)
  }

  // PC modern: menyala (animasi 3 frame) saat karyawan bekerja, mati saat menganggur.
  {
    const id = 'MODERN_PC'
    const dir = path.join(outDir, id)
    const sprites = {
      MODERN_PC_FRONT_ON_1: pcFront(codeScreen(0)),
      MODERN_PC_FRONT_ON_2: pcFront(codeScreen(1)),
      MODERN_PC_FRONT_ON_3: pcFront(codeScreen(2)),
      MODERN_PC_FRONT_OFF: pcFront(offScreen),
      MODERN_PC_BACK: pcBack(),
      MODERN_PC_SIDE: pcSide(),
    }
    for (const [name, spr] of Object.entries(sprites)) spr.save(path.join(dir, `${name}.png`))
    const s = sprites.MODERN_PC_BACK
    const manifest = {
      id, name: 'PC Modern', category: 'electronics', type: 'group', groupType: 'rotation',
      rotationScheme: '3-way-mirror', canPlaceOnWalls: false, canPlaceOnSurfaces: true, backgroundTiles: 1,
      members: [
        {
          type: 'group', groupType: 'state', orientation: 'front',
          members: [
            {
              type: 'group', groupType: 'animation', state: 'on',
              members: [1, 2, 3].map((n, i) => asset(`MODERN_PC_FRONT_ON_${n}`, s, 1, 2, { frame: i })),
            },
            asset('MODERN_PC_FRONT_OFF', s, 1, 2, { state: 'off' }),
          ],
        },
        asset('MODERN_PC_BACK', s, 1, 2, { orientation: 'back' }),
        asset('MODERN_PC_SIDE', s, 1, 2, { orientation: 'side', mirrorSide: true }),
      ],
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    ids.push(id)
  }

  // Kursi berputar: depan / belakang / samping (samping dicerminkan otomatis).
  const kursi = [
    ['EXEC_CHAIR', 'Kursi Eksekutif', { depan: execChairFront, belakang: execChairBack, samping: execChairSide }],
    ...GENZ_ROTASI,
  ]
  for (const [id, name, gambar] of kursi) {
    const dir = path.join(outDir, id)
    const sprites = { [`${id}_FRONT`]: gambar.depan(), [`${id}_BACK`]: gambar.belakang(), [`${id}_SIDE`]: gambar.samping() }
    for (const [nama, spr] of Object.entries(sprites)) spr.save(path.join(dir, `${nama}.png`))
    const s = sprites[`${id}_FRONT`]
    const manifest = {
      id, name, category: 'chairs', type: 'group', groupType: 'rotation',
      rotationScheme: '3-way-mirror', canPlaceOnWalls: false, canPlaceOnSurfaces: false, backgroundTiles: 0,
      members: [
        asset(`${id}_FRONT`, s, 1, 1, { orientation: 'front' }),
        asset(`${id}_BACK`, s, 1, 1, { orientation: 'back' }),
        asset(`${id}_SIDE`, s, 1, 1, { orientation: 'side', mirrorSide: true }),
      ],
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    ids.push(id)
  }

  return ids
}
