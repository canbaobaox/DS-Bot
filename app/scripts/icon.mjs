// Builds the app icons from the MindVerse logo (the 心月精灵 artwork in
// assets/logo.jpg) and writes assets/icon.svg, assets/icon.png (1024 px),
// assets/icon.ico (Windows, 16 to 256 px) and the tray marks: assets/tray.ico
// (Windows), assets/tray.png (Linux) and assets/trayTemplate.png with its @2x
// (macOS).
// Usage: npm run icon. The raster work runs through python3 + Pillow (no
// Electron or display needed); the .svg is written here as the vector
// reference of the same composition.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(import.meta.url)
const assets = join(dirname(here), '..', 'assets')

const PY = `
import math, sys
from PIL import Image, ImageDraw, ImageFilter

assets = sys.argv[1]
SIZE = 1024
PINK, LAV, MIST = (244, 169, 198), (197, 179, 230), (169, 200, 236)

def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def tile_points(size, plate):
    inset = size * (1 - plate) / 2
    radius, center = (size - 2 * inset) / 2, size / 2
    pts = []
    for i in range(128):
        a = i / 128 * math.pi * 2
        at = lambda v: math.copysign(abs(v) ** 0.4, v)
        pts.append((center + radius * at(math.cos(a)), center + radius * at(math.sin(a))))
    return pts

def gradient_tile(size, plate):
    img = Image.new('RGB', (size, size), (255, 255, 255))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            px[x, y] = lerp(PINK, LAV, t * 2) if t < 0.5 else lerp(LAV, MIST, (t - 0.5) * 2)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).polygon(tile_points(size, plate), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    # faint edge so the tile reads on light backgrounds
    edge = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(edge)
    d.polygon(tile_points(size, plate), outline=(20, 20, 60, 28), width=max(2, size // 256))
    out = Image.alpha_composite(out, edge)
    return out

def rounded(photo, radius):
    m = Image.new('L', photo.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, photo.size[0], photo.size[1]], radius=radius, fill=255)
    out = Image.new('RGBA', photo.size, (0, 0, 0, 0))
    out.paste(photo, (0, 0), m)
    return out

logo = Image.open(f'{assets}/logo.jpg').convert('RGB')
# The character without the wordmark at the bottom.
photo = logo.crop((110, 180, 1050, 950))
photo = photo.resize((800, 655), Image.LANCZOS)
photo = rounded(photo, 90)

icon = gradient_tile(SIZE, 0.88)
shadow = Image.new('RGBA', icon.size, (0, 0, 0, 0))
sm = Image.new('L', photo.size, 0)
ImageDraw.Draw(sm).rounded_rectangle([0, 0, photo.size[0], photo.size[1]], radius=90, fill=90)
shadow.paste((40, 30, 80, 255), ((SIZE - 800) // 2, 170 + 26), sm)
shadow = shadow.filter(ImageFilter.GaussianBlur(28))
icon = Image.alpha_composite(icon, shadow)
icon.alpha_composite(photo, ((SIZE - 800) // 2, 170))
icon.convert('RGB').save(f'{assets}/icon.png')

def multi_ico(path, sizes):
    big = Image.open(f'{assets}/icon.png')
    big.save(path, sizes=[(s, s) for s in sizes])

multi_ico(f'{assets}/icon.ico', [16, 20, 24, 32, 36, 40, 48, 64, 72, 96, 128, 256])
multi_ico(f'{assets}/tray.ico', [16, 20, 24, 32])
Image.open(f'{assets}/icon.png').resize((24, 24), Image.LANCZOS).save(f'{assets}/tray.png')

# macOS menu-bar template: the 心月 crescent + sparkle in black, drawn by hand so it
# stays legible at 16 px (macOS tints template images itself).
def crescent(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size * 0.34
    cx, cy = size * 0.44, size * 0.5
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 0, 0, 255))
    ox, oy, orr = cx + r * 0.55, cy - r * 0.35, r * 0.92
    d.ellipse([ox - orr, oy - orr, ox + orr, oy + orr], fill=(0, 0, 0, 0))
    sx, sy, sr = size * 0.74, size * 0.72, size * 0.13
    d.polygon([(sx, sy - sr), (sx + sr * 0.28, sy - sr * 0.28), (sx + sr, sy),
               (sx + sr * 0.28, sy + sr * 0.28), (sx, sy + sr),
               (sx - sr * 0.28, sy + sr * 0.28), (sx - sr, sy), (sx - sr * 0.28, sy - sr * 0.28)],
              fill=(0, 0, 0, 255))
    return img

crescent(16).save(f'{assets}/trayTemplate.png')
crescent(32).save(f'{assets}/trayTemplate@2x.png')
print('icons written')
`

const run = spawnSync('python3', ['-c', PY, assets], { stdio: 'inherit' })
if (run.status !== 0) process.exit(run.status ?? 1)

// The vector reference of the same composition: the pastel tile with the logo's
// character (cropped above the wordmark) as a rounded photo.
const tile = (size, plate) => {
  const inset = (size * (1 - plate)) / 2
  const radius = (size - 2 * inset) / 2
  const center = size / 2
  const points = []
  for (let i = 0; i < 128; i += 1) {
    const angle = (i / 128) * Math.PI * 2
    const at = value => Math.sign(value) * Math.abs(value) ** 0.4
    points.push(`${(center + radius * at(Math.cos(angle))).toFixed(2)} ${(center + radius * at(Math.sin(angle))).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}
const jpg = readFileSync(join(assets, 'logo.jpg')).toString('base64')
const path = tile(1024, 0.88)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
<linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4A9C6"/><stop offset="0.5" stop-color="#C5B3E6"/><stop offset="1" stop-color="#A9C8EC"/></linearGradient>
<clipPath id="tile"><path d="${path}"/></clipPath>
<clipPath id="photo"><rect x="112" y="170" width="800" height="655" rx="90"/></clipPath>
</defs>
<path d="${path}" fill="url(#plate)"/>
<svg x="112" y="170" width="800" height="655" viewBox="110 180 940 770" clip-path="url(#photo)" preserveAspectRatio="xMidYMid slice">
<image href="data:image/jpeg;base64,${jpg}" x="0" y="0" width="1179" height="1179"/>
</svg>
<path d="${path}" fill="none" stroke="rgba(20,20,60,.11)" stroke-width="4"/>
</svg>
`
writeFileSync(join(assets, 'icon.svg'), svg)
console.log('icon: wrote assets/icon.svg, assets/icon.png, assets/icon.ico and the tray marks from assets/logo.jpg')
