# Model 3D karyawan Kantor Ricko, dirakit dari bentuk dasar supaya ringan dan mudah diubah.
# Ciri tiap orang diambil dari foto profilnya (rambut, baju, aksesori).
# Hasil: kantor-3d/web/tokoh.glb (dimuat web/tokoh.js). Jalankan ulang setelah mengubah file ini:
#   blender --background --python kantor-3d/model/karyawan.py
# atau di Blender: tab Scripting > Open > Run Script (adegan "Karyawan" dibuat ulang, adegan lain tidak disentuh).
#
# Tiap karyawan = 6 objek <id>_<bagian> (tubuh, kepala, lenganKi, lenganKa, kakiKi, kakiKa).
# Titik asal objek = sendinya (leher, bahu, pinggul) karena tokoh.js memutar bagian itu untuk pose
# jalan/duduk/tidur. Koordinat ditulis seperti Three.js (y ke atas, wajah menghadap +z).
import bpy, bmesh, math, os
from mathutils import Matrix, Vector, Euler

FOLDER = os.path.dirname(os.path.abspath(__file__))
HASIL = os.path.normpath(os.path.join(FOLDER, '..', 'web', 'tokoh.glb'))
KE_BLENDER = Matrix.Rotation(math.radians(90), 4, 'X')   # (x, y, z) Three.js -> (x, -z, y) Blender
SENDI = {'tubuh': (0, 0, 0), 'kepala': (0, 1.16, 0), 'lenganKi': (-0.28, 0.86, 0), 'lenganKa': (0.28, 0.86, 0),
         'kakiKi': (-0.11, 0.46, 0), 'kakiKa': (0.11, 0.46, 0)}
PI = math.pi


def linear(hexa):
    h = hexa.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


class Bagian:
    """Satu bagian tubuh = satu jaring berwarna per sudut (vertex color), tanpa tekstur."""

    def __init__(s):
        s.bm = bmesh.new()
        s.warna = s.bm.loops.layers.float_color.new('Col')

    def _isi(s, verts, warna, halus=True):
        c = linear(warna)
        for f in {f for v in verts for f in v.link_faces}:
            f.smooth = halus and len(f.verts) <= 4      # tutup tabung tetap rata
            for l in f.loops:
                l[s.warna] = c
        return s

    @staticmethod
    def _m(pos, rot, skala, dasar=Matrix()):
        return Matrix.Translation(pos) @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((*skala, 1)) @ dasar

    def bola(s, r, warna, pos, skala=(1, 1, 1), rot=(0, 0, 0), seg=10, cincin=7):
        v = bmesh.ops.create_uvsphere(s.bm, u_segments=seg, v_segments=cincin, radius=r, matrix=s._m(pos, rot, skala))['verts']
        return s._isi(v, warna)

    def tabung(s, r1, r2, tinggi, warna, pos, rot=(0, 0, 0), seg=10):
        """Tabung/kerucut sepanjang sumbu y dari pos setinggi `tinggi` (negatif = ke bawah); r1 di ujung bawah."""
        dasar = Matrix.Translation((0, tinggi / 2, 0)) @ Matrix.Rotation(-PI / 2, 4, 'X')
        v = bmesh.ops.create_cone(s.bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=abs(tinggi),
                                  matrix=s._m(pos, rot, (1, 1, 1), dasar))['verts']
        return s._isi(v, warna)

    def kotak(s, ukuran, warna, pos, rot=(0, 0, 0)):
        v = bmesh.ops.create_cube(s.bm, size=1, matrix=s._m(pos, rot, ukuran))['verts']
        return s._isi(v, warna, halus=False)

    def cincin(s, R, r, warna, pos, rot=(0, 0, 0), seg=16, sisi=5):
        """Torus; tanpa putaran lubangnya menghadap depan (+z)."""
        m = s._m(pos, rot, (1, 1, 1))
        g = [[s.bm.verts.new(m @ Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
              for b in (2 * PI * j / sisi for j in range(sisi))] for a in (2 * PI * i / seg for i in range(seg))]
        for i in range(seg):
            for j in range(sisi):
                s.bm.faces.new((g[i][j], g[(i + 1) % seg][j], g[(i + 1) % seg][(j + 1) % sisi], g[i][(j + 1) % sisi]))
        return s._isi([v for baris in g for v in baris], warna)

    def jadi(s, nama, induk, bahan):
        bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces)
        bmesh.ops.transform(s.bm, matrix=KE_BLENDER, verts=s.bm.verts)
        me = bpy.data.meshes.new(nama)
        s.bm.to_mesh(me)
        s.bm.free()
        me.color_attributes.active_color = me.color_attributes['Col']
        me.materials.append(bahan)
        ob = bpy.data.objects.new(nama, me)
        ob.parent = induk
        ob.location = KE_BLENDER @ Vector(SENDI[nama.split('_')[-1]])
        induk.users_collection[0].objects.link(ob)
        return ob


# ---------- bagian umum ----------
SEPATU = '#3a2f2a'


def wajah(k, c):
    kulit, alis = c['kulit'], c.get('alis', c['rambut'])
    k.bola(0.27, kulit, (0, 0, 0), skala=(1, 0.96, 0.96), seg=16, cincin=11)
    for sx in (-1, 1):
        x = 0.095 * sx
        k.bola(0.05, '#fbf8f2', (x, -0.005, 0.228), skala=(1, 1.15, 0.45))
        k.bola(0.034, '#3a2418', (x, -0.01, 0.249), skala=(1, 1.15, 0.4))
        k.bola(0.011, '#ffffff', (x - 0.012 * sx, 0.012, 0.262), seg=6, cincin=4)
        k.kotak((0.085, 0.02, 0.02), alis, (0.1 * sx, 0.085, 0.235), rot=(0, 0, -0.12 * sx))
        k.bola(0.055, kulit, (0.262 * sx, -0.02, 0), skala=(0.45, 1, 0.8))                  # telinga
        if c.get('pipi'):
            k.bola(0.04, '#eba08b', (0.165 * sx, -0.07, 0.2), skala=(1, 0.65, 0.35))
    k.bola(0.028, c.get('hidung', kulit), (0, -0.05, 0.256))
    k.bola(0.04, '#a5524b', (0, -0.118, 0.226), skala=(1, 0.28, 0.4))                      # senyum
    k.bola(0.28, c['rambut'], (0, 0.07, -0.045), skala=(1, 0.92, 0.95), seg=16, cincin=10)   # tudung rambut


def badan(k, c):
    k.tabung(c.get('pinggul', 0.25), 0.2, 0.46, c['baju'], (0, 0.44, 0), seg=14)
    k.bola(0.2, c['baju'], (0, 0.88, 0), skala=(1, 0.3, 0.85), seg=12)                     # bahu membulat
    k.tabung(0.072, 0.068, 0.12, c['kulit'], (0, 0.86, 0), seg=10)                          # leher


def lengan(k, c, sisi):
    k.bola(c.get('bahu', 0.074), c['lengan'], (0, 0, 0))
    k.tabung(0.068, 0.066, -0.3, c['lengan'], (0, 0, 0))
    k.bola(0.068, c['kulit'], (0, -0.34, 0.012), skala=(1, 1.15, 1.1))


def kaki(k, c, sisi):
    k.tabung(0.088, 0.085, -0.38, c['celana'], (0, 0, 0))
    k.bola(0.09, c.get('sepatu', SEPATU), (0, -0.41, 0.04), skala=(1, 0.6, 1.5))


def leher_v(k, c, y=0.85):
    k.kotak((0.085, 0.085, 0.02), c['kulit'], (0, y, 0.198), rot=(0, 0, PI / 4))


# ---------- ciri tiap karyawan (lihat foto profil) ----------
def joko_kepala(k, c):
    r = c['rambut']
    for pos, skala in (((-0.08, 0.2, 0.13), (1.2, 0.55, 0.9)), ((0.09, 0.21, 0.12), (1.1, 0.55, 0.9)),
                       ((-0.17, 0.12, 0.12), (0.8, 0.75, 0.9)), ((0.19, 0.15, 0.07), (0.8, 0.7, 0.9)),
                       ((0, 0.27, -0.02), (1.3, 0.5, 1.1))):
        k.bola(0.12, r, pos, skala=skala)


def joko_tubuh(k, c):
    k.kotak((0.13, 0.2, 0.02), '#1f1f24', (0, 0.73, 0.214))                                 # kaus hitam
    for sx in (-1, 1):
        k.kotak((0.012, 0.3, 0.012), '#d8d2c8', (0.075 * sx, 0.6, 0.222))                    # ritsleting
        k.kotak((0.012, 0.15, 0.012), '#f2ede4', (0.045 * sx, 0.72, 0.226))                  # tali hoodie
        k.tabung(0.064, 0.064, 0.05, '#2a2a2e', (0.115 * sx, 0.86, 0.12), rot=(PI / 2, 0, 0), seg=12)  # headphone
    k.bola(0.2, c['baju'], (0, 0.9, -0.14), skala=(1.1, 0.55, 0.7))                         # tudung hoodie
    k.cincin(0.13, 0.022, '#2a2a2e', (0, 0.93, 0.02), rot=(PI / 2, 0, 0), seg=14)


def asep_kepala(k, c):
    k.bola(0.2, c['rambut'], (-0.05, 0.2, 0.1), skala=(1, 0.42, 0.75))
    k.bola(0.17, c['rambut'], (0.1, 0.21, 0.06), skala=(1, 0.4, 0.8))


def asep_tubuh(k, c):
    k.kotak((0.13, 0.22, 0.02), '#f6f4ee', (0, 0.77, 0.213))                                # kemeja putih
    k.kotak((0.045, 0.22, 0.015), '#1d2b4f', (0, 0.72, 0.226))                               # dasi
    k.kotak((0.055, 0.04, 0.02), '#1d2b4f', (0, 0.84, 0.222))
    for sx in (-1, 1):
        k.kotak((0.05, 0.24, 0.015), '#2f4777', (0.075 * sx, 0.74, 0.218), rot=(0, 0, 0.32 * sx))  # kerah jas


def kokom_kepala(k, c):
    r, r2 = c['rambut'], '#b4552a'
    k.bola(0.2, r, (0, 0.22, -0.02), skala=(1.25, 0.6, 1.15))
    k.bola(0.13, r2, (-0.12, 0.19, 0.14), skala=(1.2, 0.6, 0.8))
    k.bola(0.1, r, (0.14, 0.18, 0.13))
    for i, sudut in enumerate(range(55, 310, 20)):                                          # ikal sampai bahu
        a = math.radians(sudut)
        for j, y in enumerate((0.04, -0.12, -0.26)):
            rr = 0.27 + 0.02 * j
            k.bola(0.1 - 0.008 * j, r2 if (i + j) % 3 == 0 else r, (math.sin(a) * rr, y, math.cos(a) * rr * 0.9 - 0.03))
    for sx in (-1, 1):
        k.cincin(0.024, 0.006, '#d8a845', (0.272 * sx, -0.095, 0.03), rot=(0, PI / 2, 0), seg=10, sisi=4)
    k.tabung(0.014, 0.014, 0.2, '#f0b232', (0.17, 0.08, 0.15), rot=(0, 0, -1.0), seg=6)    # pensil di telinga
    k.bola(0.013, '#3a2f2a', (0.335, 0.19, 0.15), seg=6, cincin=4)


def kokom_tubuh(k, c):
    leher_v(k, c)
    k.bola(0.016, '#d8a845', (0, 0.77, 0.222), seg=8, cincin=5)                             # liontin


def kokom_lenganKi(k, c):
    k.kotak((0.11, 0.15, 0.03), '#3a3d48', (0, -0.38, 0.075))                               # kalkulator
    k.kotak((0.08, 0.04, 0.006), '#b8c4a8', (0, -0.335, 0.092))


def ujang_kepala(k, c):
    r = c['rambut']
    for x, z, t, mir in ((-0.15, 0.08, 0.18, -0.6), (-0.05, 0.13, 0.22, -0.2), (0.07, 0.13, 0.24, 0.2), (0.17, 0.07, 0.18, 0.6),
                         (-0.1, -0.06, 0.2, -0.4), (0.04, -0.04, 0.22, 0.1), (0.15, -0.08, 0.18, 0.5), (0, 0.03, 0.24, 0)):
        k.tabung(0.085, 0, t, r, (x, 0.18, z), rot=(0.35, 0, -mir), seg=6)


def ujang_tubuh(k, c):
    for sx in (-1, 1):
        k.kotak((0.09, 0.04, 0.07), '#e4e0d6', (0.065 * sx, 0.9, 0.15), rot=(0.3, 0, 0.5 * sx))    # kerah
        k.kotak((0.024, 0.3, 0.012), '#2f8f4e', (0.055 * sx, 0.73, 0.222), rot=(0, 0, 0.18 * sx))  # lanyard
    k.kotak((0.07, 0.09, 0.012), '#2f9a50', (0, 0.56, 0.24))                                 # kartu
    k.kotak((0.07, 0.07, 0.012), '#2f9a50', (0.11, 0.62, 0.225))                             # kartu spreadsheet di saku
    k.kotak((0.05, 0.045, 0.006), '#f4f2ea', (0.11, 0.62, 0.233))


def neneng_kepala(k, c):
    r = c['rambut']
    k.bola(0.27, r, (0, -0.04, -0.1), skala=(1.05, 0.95, 0.8))
    for sx in (-1, 1):
        k.bola(0.2, r, (0.215 * sx, -0.06, -0.01), skala=(0.48, 1.05, 1.1))
        k.cincin(0.055, 0.007, '#2a2422', (0.095 * sx, -0.005, 0.262), seg=14, sisi=4)          # kacamata bulat
        k.kotak((0.008, 0.008, 0.16), '#2a2422', (0.2 * sx, 0, 0.15))
    k.kotak((0.05, 0.008, 0.008), '#2a2422', (0, 0, 0.268))
    k.bola(0.2, r, (0, 0.15, 0.16), skala=(1.3, 0.42, 0.62))                                # poni


def neneng_tubuh(k, c):
    leher_v(k, c)
    for sx in (-1, 1):
        k.kotak((0.09, 0.035, 0.06), '#b82326', (0.06 * sx, 0.88, 0.16), rot=(0.4, 0, 0.45 * sx))  # kerah


def neneng_lenganKi(k, c):
    k.tabung(0.013, 0.013, -0.1, '#1e1a18', (0, -0.36, 0.06), seg=6)                        # kaca pembesar
    k.cincin(0.065, 0.011, '#1e1a18', (0, -0.53, 0.06), seg=16, sisi=4)
    k.bola(0.06, '#cfe3ea', (0, -0.53, 0.06), skala=(1, 1, 0.15))


def ayu_kepala(k, c):
    r = c['rambut']
    k.bola(0.3, r, (0, -0.25, -0.12), skala=(1.0, 1.4, 0.6))                                # rambut panjang
    k.bola(0.24, r, (0, -0.55, -0.15), skala=(1.0, 1.0, 0.45))
    for sx in (-1, 1):
        k.bola(0.1, r, (0.22 * sx, -0.3, 0.05), skala=(0.7, 2.2, 0.7))
    k.bola(0.13, r, (-0.13, 0.16, 0.15), skala=(1.2, 0.6, 0.8))
    cx, cy, cz = 0.25, 0.1, 0.09                                                             # bunga kamboja
    for i in range(5):
        a = 2 * PI * i / 5
        k.bola(0.035, '#fbf7ee', (cx + 0.01, cy + 0.04 * math.cos(a), cz + 0.04 * math.sin(a)), skala=(0.5, 1, 1))
    k.bola(0.02, '#f3c84a', (cx + 0.025, cy, cz), seg=8, cincin=5)
    k.tabung(0.006, 0.006, -0.06, '#c88a5a', (-0.272, -0.11, 0.03), seg=5)                  # anting kuas + palet
    k.bola(0.025, '#f1d9b5', (-0.275, -0.19, 0.04), skala=(0.3, 1, 1))


def ayu_tubuh(k, c):
    k.kotak((0.13, 0.06, 0.02), c['kulit'], (0, 0.86, 0.19))
    for sx in (-1, 1):
        k.kotak((0.03, 0.4, 0.015), '#f7b7a3', (0.06 * sx, 0.65, 0.235), rot=(0, 0, 0.14 * sx))   # pinggiran kebaya


KARYAWAN = {
    'pak-asep': dict(kulit='#d9a47c', rambut='#211915', baju='#263a63', lengan='#263a63', celana='#1f2c4a', sepatu='#1c1714',
                     kepala=asep_kepala, tubuh=asep_tubuh),
    'kokom': dict(kulit='#efc39f', rambut='#93421f', alis='#4a2a1c', baju='#262636', lengan='#262636', celana='#2c2c36', pipi=True,
                  kepala=kokom_kepala, tubuh=kokom_tubuh, lenganKi=kokom_lenganKi),
    'ujang': dict(kulit='#d8a079', rambut='#3a2215', baju='#f2f0ea', lengan='#f2f0ea', celana='#4a5874',
                  kepala=ujang_kepala, tubuh=ujang_tubuh),
    'joko': dict(kulit='#d29a70', rambut='#17110f', baju='#ef7b1d', lengan='#ef7b1d', celana='#2d2f36',
                 kepala=joko_kepala, tubuh=joko_tubuh),
    'neneng': dict(kulit='#eec4a0', rambut='#141012', baju='#cf2a2c', lengan='#cf2a2c', celana='#2d2a2c', pipi=True,
                   kepala=neneng_kepala, tubuh=neneng_tubuh, lenganKi=neneng_lenganKi),
    'ayu': dict(kulit='#e3ad88', rambut='#18110f', baju='#e86b8c', lengan='#e86b8c', celana='#9d3f5b', pipi=True, pinggul=0.3, bahu=0.088,
                kepala=ayu_kepala, tubuh=ayu_tubuh),
}


def bahan_warna():
    b = bpy.data.materials.get('Karyawan') or bpy.data.materials.new('Karyawan')
    b.use_nodes = True
    n = b.node_tree.nodes
    bsdf = next(x for x in n if x.type == 'BSDF_PRINCIPLED')
    warna = next((x for x in n if x.type == 'VERTEX_COLOR'), None) or n.new('ShaderNodeVertexColor')
    warna.layer_name = 'Col'
    b.node_tree.links.new(warna.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.85
    return b


def bangun():
    # Di jendela Blender: adegan sendiri "Karyawan" supaya adegan lain tidak tersentuh.
    # Mode --background: adegan bawaan saja (tidak disimpan).
    if bpy.app.background:
        adegan = bpy.context.scene
    else:
        adegan = bpy.data.scenes.get('Karyawan') or bpy.data.scenes.new('Karyawan')
        for w in bpy.context.window_manager.windows:
            w.scene = adegan
            for area in w.screen.areas:
                if area.type == 'VIEW_3D':
                    area.spaces.active.shading.color_type = 'VERTEX'   # tampilkan warnanya
    for ob in list(adegan.objects):
        bpy.data.objects.remove(ob)
    for me in list(bpy.data.meshes):
        if me.users == 0:
            bpy.data.meshes.remove(me)
    bahan = bahan_warna()
    for i, (id_, c) in enumerate(KARYAWAN.items()):
        induk = bpy.data.objects.new(id_, None)
        adegan.collection.objects.link(induk)
        induk.location = ((i - 2.5) * 1.1, 0, 0)
        for nama, dasar in (('tubuh', badan), ('kepala', wajah), ('lenganKi', lengan), ('lenganKa', lengan),
                            ('kakiKi', kaki), ('kakiKa', kaki)):
            k = Bagian()
            if nama in ('tubuh', 'kepala'):
                dasar(k, c)
            else:
                dasar(k, c, -1 if nama.endswith('Ki') else 1)
            if nama in c:
                c[nama](k, c)
            k.jadi(f'{id_}_{nama}', induk, bahan)
    return adegan


def ekspor(adegan):
    lapisan = adegan.view_layers[0]
    lapisan.update()                                   # objek baru harus tersinkron sebelum diekspor
    for ob in lapisan.objects:
        ob.select_set(ob.name.split('_')[0] in KARYAWAN, view_layer=lapisan)
    jendela = bpy.context.window_manager.windows[:1]
    with bpy.context.temp_override(**({'window': jendela[0]} if jendela else {})):
        bpy.ops.export_scene.gltf(filepath=HASIL, export_format='GLB', use_selection=True, export_materials='NONE',
                                  export_vertex_color='ACTIVE', export_texcoords=False, export_yup=True, export_apply=False)


adegan = bangun()
ekspor(adegan)
print('tokoh.glb:', HASIL, os.path.getsize(HASIL), 'byte,', sum(len(o.data.polygons) for o in adegan.objects if o.type == 'MESH'), 'poligon')
