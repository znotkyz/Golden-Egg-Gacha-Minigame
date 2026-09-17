"""
Remove background from assets/egg.png with smooth anti-aliased edges.
"""
from PIL import Image, ImageFilter
from collections import deque
import shutil

# 1. Backup original
shutil.copyfile('assets/egg.png', 'assets/egg_backup.png')

# 2. Open image
img = Image.open('assets/egg.png').convert('RGBA')
w, h = img.size
pixels = img.load()

# Background color reference: cream #fbead2
bg_ref = (251, 237, 210)

def is_bg(x, y):
    # Stray sparkle artifact in bottom-left corner
    if x <= 4 and 145 <= y <= 160:
        return True
    
    r, g, b, a = pixels[x, y]
    
    # Distance to cream background
    dist = ((r - bg_ref[0])**2 + (g - bg_ref[1])**2 + (b - bg_ref[2])**2) ** 0.5
    if dist < 45:
        return True
    
    # Check if pale light cream (high R, high G, high B)
    # The egg's gold, red ribbon, and dark outline have much lower B or much lower G
    if r > 230 and g > 215 and b > 170:
        return True
        
    return False

# 3. Flood-fill from outer borders to find all background pixels
visited = [[False] * h for _ in range(w)]
bg_mask = [[False] * h for _ in range(w)]
queue = deque()

# Seed all 4 edges
for x in range(w):
    queue.append((x, 0))
    queue.append((x, h - 1))
for y in range(h):
    queue.append((0, y))
    queue.append((w - 1, y))

while queue:
    x, y = queue.popleft()
    if visited[x][y]:
        continue
    visited[x][y] = True
    
    if is_bg(x, y):
        bg_mask[x][y] = True
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                queue.append((nx, ny))

# 4. Create transparent image with smooth anti-aliased edge
out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
out_pixels = out.load()

# Create alpha mask (0 for bg, 255 for egg)
alpha_mask = Image.new('L', (w, h), 0)
alpha_pixels = alpha_mask.load()

for y in range(h):
    for x in range(w):
        if not bg_mask[x][y]:
            alpha_pixels[x, y] = 255

# Apply a very subtle feathering/blur (radius 0.6) to the mask boundary for silky edges
mask_blurred = alpha_mask.filter(ImageFilter.GaussianBlur(radius=0.5))
mask_blur_pixels = mask_blurred.load()

for y in range(h):
    for x in range(w):
        if bg_mask[x][y]:
            # Defringe edge pixels that have partial alpha
            a = mask_blur_pixels[x, y]
            if a > 15:
                # Find nearest non-bg pixel color to defringe cream tint
                r, g, b, _ = pixels[x, y]
                out_pixels[x, y] = (r, g, b, a)
            else:
                out_pixels[x, y] = (0, 0, 0, 0)
        else:
            r, g, b, _ = pixels[x, y]
            out_pixels[x, y] = (r, g, b, 255)

out.save('assets/egg.png', 'PNG')
print('Successfully removed background and saved to assets/egg.png')
