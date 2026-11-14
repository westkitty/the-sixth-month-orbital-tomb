"""Verify every material PNG can be decoded, record provenance and regenerate audit data."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import hashlib,json,statistics
ROOT=Path(__file__).resolve().parents[1]
TEX=ROOT/'public'/'textures'
OUT=ROOT/'docs'/'visual';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
for path in sorted(TEX.glob('*.png')):
    with Image.open(path) as im:
        im.verify()
    with Image.open(path) as im:
        im.load()
        w,h=im.size
        assert w>=96 and h>=96
        assert im.mode in ('RGB','RGBA','L'),(path,im.mode)
        extrema=im.convert('RGB').getextrema()
        assert max(mx-mn for mn,mx in extrema)>15,(path,extrema)
        rows.append({'name':path.name,'width':w,'height':h,'mode':im.mode,
                     'size_bytes':path.stat().st_size,
                     'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                     'use':'authored in-game material' if not path.stem.startswith('door_') else 'original service-panel signage'})
manifest={'generator':'tools/generate_materials.py','purpose':'source-informed original Meridian game textures',
          'source_images_copied_into_maps':False,'runtime_external_network':False,
          'files':rows,'total_bytes':sum(x['size_bytes'] for x in rows)}
(OUT/'ASSET_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
# An offline review proof of the real produced pixels; NOT a claim of WebGL rendering.
labels=['titanium_panel_albedo.png','deck_grate_albedo.png','monitor_console.png','door_observation.png','door_cryo.png','door_hydro.png','door_cargo.png','caution_band.png','meridian_identification.png','viewport_frost.png','dock_id_atlas.png','wayfinding_floor.png']
CAN=(1216,1260)
sheet=Image.new('RGB',CAN,(16,24,29));d=ImageDraw.Draw(sheet)
try:
 f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
 h=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',28)
except OSError:
 f=ImageFont.load_default();h=f
d.text((35,26),'MERIDIAN / MATERIAL ASSET QA',font=h,fill=(204,217,218))
d.text((35,69),'Physical PNG files generated from the engineering palette. NOT a gameplay screenshot.',font=f,fill=(142,171,183))
for idx,name in enumerate(labels):
    col=idx%4;row=idx//4
    x=35+col*294;y=119+row*362
    frame=(x,y,x+272,y+294)
    d.rounded_rectangle(frame,radius=6,fill=(35,45,54),outline=(71,92,102),width=2)
    with Image.open(TEX/name) as im:
        im=im.convert('RGBA');im.thumbnail((250,242),Image.Resampling.LANCZOS)
        white=Image.new('RGBA',im.size,(45,58,66,255));white.alpha_composite(im)
        sheet.paste(white.convert('RGB'),(x+(272-im.width)//2,y+12+(242-im.height)//2))
    d.text((x+8,y+264),name.replace('.png','')[:31],font=f,fill=(215,222,216))
d.text((35,1221),'Source provenance and build checks: docs/visual/VISUAL_ASSET_REPORT.md',font=f,fill=(114,147,161))
sheet.save(OUT/'MATERIAL_PIXEL_QA.png',optimize=True)
print(f'Validated {len(rows)} PNG maps, {manifest["total_bytes"]} bytes total; generated audit manifest and pixel QA board.')
