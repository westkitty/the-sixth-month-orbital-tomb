"""Source-pinned Rocketbox GLB texture-repack for the Orbital Tomb R11 scene.

Reads original private catalog GLBs. Preserves every mesh, bone, animation,
node and non-image bufferView byte for byte, replaces only embedded textures
with size-capped self-contained PNG/JPEG images. No new external decoder.
"""
from __future__ import annotations
import io, json, hashlib, struct, sys
from pathlib import Path
from PIL import Image

ASSETS = [
    ('Pilot_Female_01.glb', 'pilot_female.glb', '105Zy7dQXk2u1jLFikP_18JBZgtRNMZ7H'),
    ('Pilot_Male_01.glb', 'pilot_male.glb', '1-45JXlAtxTYDl-0N6mZafDHjFsMD3jXU'),
    ('Medical_Female_02.glb', 'medic_female.glb', '1MNXPlYGNustqohBI3LNQLVhO1Wscj9Zt'),
]


def unpack(src: bytes):
    magic, version, length = struct.unpack_from('<III', src)
    assert magic == 0x46546c67 and version == 2 and length == len(src)
    jlen, jtype = struct.unpack_from('<II', src, 12)
    assert jtype == 0x4e4f534a
    graph = json.loads(src[20:20 + jlen])
    blen, btype = struct.unpack_from('<II', src, 20 + jlen)
    assert btype == 0x004e4942 and 20 + jlen + 8 + blen == length
    return graph, src[28 + jlen:28 + jlen + blen]


def pack(graph, binary):
    jb = json.dumps(graph, separators=(',', ':'), ensure_ascii=True).encode()
    jb += b' ' * ((-len(jb)) % 4)
    bb = bytes(binary)
    bb += b'\x00' * ((-len(bb)) % 4)
    return struct.pack('<III', 0x46546c67, 2, 12 + 8 + len(jb) + 8 + len(bb)) + struct.pack('<II', len(jb), 0x4e4f534a) + jb + struct.pack('<II', len(bb), 0x004e4942) + bb


def optimize(source: Path, dest: Path, gid: str):
    raw = source.read_bytes()
    g, b = unpack(raw)
    assert len(g.get('buffers', [])) == 1
    images = {item['bufferView']: (i, item) for i, item in enumerate(g.get('images', []))}
    changed = []
    outbin = bytearray()
    for idx, view in enumerate(g['bufferViews']):
        offset = view.get('byteOffset', 0)
        block = b[offset:offset + view['byteLength']]
        assert len(block) == view['byteLength']
        if idx in images:
            i, meta = images[idx]
            im = Image.open(io.BytesIO(block)); im.load()
            oldsize = im.size
            # Rocketbox converted materials use repeating specular/normal/baseColor triples.
            # 1024 px head albedo, 768 px body albedo, compact 512 px normal, 256 px specular.
            kind = ['specular','normal','albedo'][i % 3]
            limit = (1024 if i in (5,) else 768) if kind == 'albedo' else 512 if kind == 'normal' else 256
            im.thumbnail((limit, limit), Image.Resampling.LANCZOS)
            imagebytes = io.BytesIO()
            if kind == 'albedo' and im.mode in ('RGB', 'L'):
                im.convert('RGB').save(imagebytes, format='JPEG', quality=82, progressive=False, subsampling=0)
                meta['mimeType'] = 'image/jpeg'
            else:
                im.save(imagebytes, format='PNG', optimize=True, compress_level=8)
                meta['mimeType'] = 'image/png'
            block = imagebytes.getvalue()
            changed.append({'imageIndex':i,'usage':kind,'original':oldsize,'optimized':im.size,'bytes':len(block),'mime':meta['mimeType']})
        outbin += b'\x00' * ((-len(outbin)) % 4)
        view['byteOffset'] = len(outbin)
        view['byteLength'] = len(block)
        outbin.extend(block)
    g['buffers'][0]['byteLength'] = len(outbin)
    final = pack(g, outbin)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(final)
    cg, cb = unpack(final)
    assert len(cg['meshes']) == len(g['meshes'])
    assert len(cg.get('animations', [])) == len(g.get('animations', []))
    assert len(cg.get('skins', [])) == len(g.get('skins', []))
    assert all(view.get('byteOffset', 0) + view['byteLength'] <= len(cb) for view in cg['bufferViews'])
    for img in cg['images']:
        view = cg['bufferViews'][img['bufferView']]
        assert Image.open(io.BytesIO(cb[view['byteOffset']:view['byteOffset']+view['byteLength']])).size
    return {'source_file':source.name, 'catalog_drive_file_id':gid,
        'source_sha256':hashlib.sha256(raw).hexdigest(), 'source_bytes':len(raw),
        'packaged_file':dest.name, 'packaged_sha256':hashlib.sha256(final).hexdigest(),
        'packaged_bytes':len(final), 'skeletal_rigs':len(g.get('skins', [])),
        'animations_preserved':len(g.get('animations', [])), 'images':changed}


def main():
    root = Path(__file__).resolve().parents[1]
    import_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/mnt/data')
    data = []
    for original, target, driveid in ASSETS:
        data.append(optimize(import_dir/original, root/'public/assets/crew'/target,driveid))
    ledger = {
        'origin':'Microsoft Rocketbox / user private processed-glb Drive catalog',
        'source_repository':'https://github.com/microsoft/Microsoft-Rocketbox',
        'source_commit':'0943055db6ec570bcef9f2c8b41c9e5467c808f9',
        'license':'MIT, copyright (c) 2020 Microsoft. Retain LICENSE in distributed package.',
        'status':'R11 extracted and optimized for game integration; historical identities not asserted',
        'assets':data,
    }
    (root/'docs/visual/R11_CREW_ASSET_LEDGER.json').write_text(json.dumps(ledger,indent=2)+'\n')
    print(json.dumps([{'src':x['source_file'],'old_MB':round(x['source_bytes']/1e6,2),'new_MB':round(x['packaged_bytes']/1e6,2)} for x in data],indent=2))

if __name__ == '__main__':main()
