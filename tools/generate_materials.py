"""Deterministic, original material maps for Meridian Station.

These are painted engineering surfaces, not copies of the approved concept images.
Regenerate with: python tools/generate_materials.py
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import random

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'textures'
OUT.mkdir(parents=True,exist_ok=True)
R=random.Random(461078)
N=np.random.default_rng(461078)
W=768
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def font(n,bold=False):
    try:return ImageFont.truetype(FONT_BOLD if bold else FONT,n)
    except OSError:return ImageFont.load_default()

def noise(w=W,h=W,scale=5,base=128):
    coarse=N.normal(0,1,(max(2,h//scale),max(2,w//scale)))
    c=Image.fromarray(np.uint8(np.clip(base+coarse*28,0,255)),'L').resize((w,h),Image.Resampling.BICUBIC)
    return np.asarray(c,dtype=np.float32)-base

def scratches(im,count=270,palette=None):
    d=ImageDraw.Draw(im,'RGBA')
    palette=palette or [(220,229,228,24),(3,10,14,36),(122,67,48,22)]
    w,h=im.size
    for i in range(count):
        x=R.randrange(w);y=R.randrange(h)
        length=R.choice([R.randrange(4,20),R.randrange(21,105)])
        dx=R.choice([-1,1])*R.randrange(1,5)
        col=palette[i%len(palette)]
        d.line((x,y,x+dx,y-length),fill=col,width=R.choice([1,1,1,2]))
    return im

# Cool painted titanium: large uninterrupted areas with selective edge wear, seams and recessed fasteners.
n=noise()+N.normal(0,8,(W,W))
arr=np.zeros((W,W,3),dtype=np.float32)
for k,v in enumerate([135,147,151]):arr[:,:,k]=v+n*.37
im=Image.fromarray(np.uint8(np.clip(arr,0,255)),'RGB').convert('RGBA');d=ImageDraw.Draw(im,'RGBA')
for x in [10,382,755]:
    d.line((x,0,x,W),fill=(5,12,20,165),width=5)
    d.line((x+5,0,x+5,W),fill=(227,237,235,48),width=2)
for y in [11,390,755]:
    d.line((0,y,W,y),fill=(8,18,22,165),width=5)
    d.line((0,y+5,W,y+5),fill=(232,238,237,50),width=2)
for x in [33,360,405,730]:
    for y in [28,365,418,729]:
        d.ellipse((x-6,y-6,x+6,y+6),fill=(17,30,34,220),outline=(209,213,213,85),width=2)
        d.ellipse((x-2,y-2,x+2,y+2),fill=(142,153,153,180))
for j in range(18):
    x=R.randrange(W);y=R.randrange(W);rw=R.randint(2,9);rh=R.randint(14,80)
    d.rectangle((x,y,x+rw,y+rh),fill=(91,49,38,R.randrange(8,27)))
scratches(im,280)
im.convert('RGB').save(OUT/'titanium_panel_albedo.png',optimize=True)
rr=np.uint8(np.clip(194+N.normal(0,12,(W,W))+noise(scale=22)*.17,125,245))
Image.fromarray(rr,'L').save(OUT/'titanium_panel_roughness.png',optimize=True)

# Dark, oil-worked deck plate: repeating inset grates and tactile traction rails.
arr=np.zeros((W,W,3),np.uint8)
base=47+N.normal(0,4,(W,W))+noise(scale=18)*.1
for k,v in enumerate([0,7,12]):arr[:,:,k]=np.uint8(np.clip(base+v,0,255))
floor=Image.fromarray(arr,'RGB').convert('RGBA');d=ImageDraw.Draw(floor,'RGBA')
for yy in range(0,W,192):
    for xx in range(0,W,192):
        d.rectangle((xx+8,yy+8,xx+184,yy+184),outline=(151,165,167,155),width=5)
        d.rectangle((xx+17,yy+17,xx+175,yy+175),outline=(12,17,21,235),width=4)
        d.rectangle((xx+36,yy+42,xx+157,yy+151),fill=(12,18,21,235))
        for gx in range(xx+47,xx+155,16):
            d.rounded_rectangle((gx,yy+47,gx+6,yy+145),radius=2,fill=(3,8,10,255))
            d.line((gx+9,yy+49,gx+9,yy+144),fill=(115,128,126,55),width=1)
        for x in [xx+22,xx+170]:
            for y in [yy+22,yy+169]:d.ellipse((x-3,y-3,x+3,y+3),fill=(129,132,127,175))
scratches(floor,190)
floor.convert('RGB').save(OUT/'deck_grate_albedo.png',optimize=True)
fr=np.uint8(np.clip(192+N.normal(0,15,(W,W)),135,236))
Image.fromarray(fr,'L').save(OUT/'deck_grate_roughness.png',optimize=True)

# Protected control display: cold navy faceplates, amber instrument ticks, not flashy neon.
control=Image.new('RGB',(512,512),(17,31,37));d=ImageDraw.Draw(control,'RGBA')
d.rounded_rectangle((24,24,488,488),radius=18,fill=(35,49,58,255),outline=(111,125,132,210),width=6)
d.rounded_rectangle((49,54,464,260),radius=8,fill=(6,19,24,255),outline=(116,145,151,170),width=2)
for y in [85,121,157,193,229]:d.line((70,y,446,y),fill=(83,127,136,65),width=2)
for x in [105,175,245,315,385]:d.line((x,76,x,241),fill=(89,136,141,42),width=1)
d.line([(77,194),(132,178),(165,185),(219,141),(260,157),(307,106),(361,126),(430,86)],fill=(117,169,177,210),width=4,joint='curve')
d.text((70,69),'MERIDIAN / SYSTEM MONITOR',font=font(13,True),fill=(162,188,190,210))
for x in range(63,433,41):
    d.rounded_rectangle((x,300,x+30,322),radius=3,fill=(19,26,32,255),outline=(112,126,132,160),width=2)
    d.rectangle((x+8,308,x+22,313),fill=R.choice([(179,128,67,225),(105,155,155,195),(76,88,93,195)]))
for y in [355,392,428]:
    d.rounded_rectangle((65,y,441,y+17),radius=3,fill=(14,20,25,255),outline=(78,91,93,130),width=1)
    d.rectangle((74,y+6,74+R.randrange(100,320),y+11),fill=(113,141,143,110))
for p in [(44,43),(468,43),(44,468),(468,468)]:d.ellipse((p[0]-4,p[1]-4,p[0]+4,p[1]+4),fill=(4,6,8),outline=(162,162,155))
control.save(OUT/'monitor_console.png',optimize=True)

# Service doors: a stable identification style, not a random UI pop-up.
for text,outname,color in [('OBSERVATION 02A','door_observation.png',(87,112,126)),('CRYOGENICS 04','door_cryo.png',(89,113,112)),('HYDROPONICS 03','door_hydro.png',(71,104,78)),('LOGISTICS 05','door_cargo.png',(122,80,65)),('PRESSURE ACCESS','door_service.png',(96,104,110))]:
    door=Image.new('RGB',(512,768),tuple(int(c*.75) for c in color));d=ImageDraw.Draw(door,'RGBA')
    d.rectangle((12,12,500,756),outline=(10,17,22,255),width=18)
    d.rectangle((32,32,480,736),outline=(181,190,185,105),width=3)
    for y in [171,205,579,618]:d.line((35,y,475,y),fill=(12,20,25,130),width=5)
    for x in [52,461]:
      for y in [54,718]:d.ellipse((x-6,y-6,x+6,y+6),fill=(22,29,30,220),outline=(188,192,185,110),width=2)
    d.polygon([(70,311),(442,311),(442,471),(70,471)],fill=(12,24,30,200))
    d.text((90,343),text,font=font(25,True),fill=(210,214,200,230))
    d.text((90,395),'MERIDIAN  /  VIRGIL ORBIT',font=font(16),fill=(158,172,171,195))
    d.rectangle((72,645,440,680),fill=(186,139,78,180))
    for i in range(14):
        x=64+i*30;d.line((x,680,x+40,642),fill=(20,25,28,200),width=10)
    scratches(door,200,[(210,220,212,20),(7,12,14,55),(32,22,19,27)])
    door.convert('RGB').save(OUT/outname,optimize=True)

# Hand-applied identification stencil, on a transparency retained for the 3D panel.
label=Image.new('RGBA',(1024,256),(0,0,0,0));d=ImageDraw.Draw(label,'RGBA')
d.rectangle((16,10,1008,246),fill=(15,24,30,228),outline=(143,155,151,190),width=4)
d.polygon([(54,55),(78,55),(61,206),(38,206)],fill=(181,115,65,255))
d.text((115,46),'MERIDIAN',font=font(91,True),fill=(222,226,218,240))
d.text((122,161),'VIRGIL ORBIT  //  STRUCTURE 02',font=font(27),fill=(158,181,182,215))
label.save(OUT/'meridian_identification.png',optimize=True)

# Caution band, small and modular, intentionally dirty rather than saturated safety-yellow.
hazard=Image.new('RGB',(512,96),(26,30,29));d=ImageDraw.Draw(hazard,'RGBA')
for x in range(-100,612,60):d.polygon([(x,0),(x+27,0),(x+98,96),(x+71,96)],fill=(187,130,66,235))
d.line((0,0,512,0),fill=(184,178,150,180),width=4)
d.line((0,95,512,95),fill=(13,18,21,230),width=4)
scratches(hazard,36)
hazard.save(OUT/'caution_band.png',optimize=True)

# Surface frost decal: uneven rime, along one viewport edge; does not create weather in vacuum.
fw,fh=1024,128
frost=Image.new('RGBA',(fw,fh),(0,0,0,0));d=ImageDraw.Draw(frost,'RGBA')
for x in range(0,fw,4):
  h=6+int(abs(N.normal(0,16)))
  h+=int(13*(np.sin(x*.024)+1))
  d.line((x,0,x,h),fill=(170,198,210,R.randint(18,72)),width=R.randint(2,5))
for x in range(4,fw,25):
    length=R.randint(20,92)
    d.line((x,0,x+R.choice([-3,0,4]),length),fill=(192,216,223,R.randint(42,115)),width=R.choice([1,2,3]))
for i in range(350):
 x=R.randrange(fw);y=R.randrange(70)
 d.ellipse((x,y,x+R.choice([1,2,3]),y+2),fill=(227,239,241,R.randrange(22,90)))
frost.save(OUT/'viewport_frost.png',optimize=True)

print('Wrote',len(list(OUT.glob('*.png'))),'original image assets:', sum(p.stat().st_size for p in OUT.glob('*.png')),'bytes')

# R2: Atlas of twelve original legible dock socket identity plates.
# These are diegetic reconstruction labels, not claimed historical hull markings.
atlas=Image.new('RGB',(1024,768),(15,25,31));d=ImageDraw.Draw(atlas,'RGBA')
for i in range(12):
    col=i%4;row=i//4;x=col*256;y=row*256
    d.rectangle((x+7,y+7,x+249,y+249),fill=(36,49,56),outline=(125,142,145),width=5)
    d.rectangle((x+17,y+17,x+239,y+62),fill=(17,28,35))
    d.text((x+31,y+26),'MERIDIAN / DOCK',font=font(17,True),fill=(192,211,211))
    d.text((x+53,y+75),f'{i+1:02d}',font=font(104,True),fill=(221,224,210))
    d.text((x+29,y+199),'MATING SOCKET',font=font(19,True),fill=(185,158,112))
    d.line((x+25,y+185,x+231,y+185),fill=(142,103,64),width=5)
    for xx in [x+28,x+228]:
        for yy in [y+82,y+172]:
            d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=(17,21,26),outline=(153,158,151),width=2)
atlas.save(OUT/'dock_id_atlas.png',optimize=True)

# Worn crew-deck wayfinding, visible at walking height but absent from the sky.
mark=Image.new('RGB',(384,640),(43,55,59));d=ImageDraw.Draw(mark,'RGBA')
d.rounded_rectangle((16,15,368,625),radius=10,outline=(122,138,138,155),width=5)
d.polygon([(192,65),(302,196),(242,196),(242,276),(142,276),(142,196),(82,196)],fill=(167,150,111,230))
d.rectangle((65,319,319,325),fill=(112,129,129,180))
d.text((65,351),'MERIDIAN',font=font(37,True),fill=(187,205,203))
d.text((73,413),'PRESSURE ROUTE',font=font(23,True),fill=(201,176,122))
d.text((92,459),'KEEP CLEAR',font=font(20,True),fill=(166,188,186))
for y in [548,570,592]:
    d.line((59,y,325,y),fill=(77,94,99,200),width=2)
scratches(mark,75)
mark.save(OUT/'wayfinding_floor.png',optimize=True)
