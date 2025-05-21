from PIL import Image, ImageDraw
import numpy as np

def create_icon(enabled=True):
    # Create a new image with transparent background
    size = 128
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Draw a simple cat-like character
    # Body
    body_color = (255, 165, 0) if enabled else (128, 128, 128)  # Orange for enabled, gray for disabled
    draw.ellipse([20, 20, 108, 108], fill=body_color)
    
    # Ears
    ear_color = (255, 192, 203) if enabled else (192, 192, 192)  # Pink for enabled, light gray for disabled
    draw.polygon([(30, 30), (20, 10), (40, 20)], fill=ear_color)  # Left ear
    draw.polygon([(98, 30), (108, 10), (88, 20)], fill=ear_color)  # Right ear
    
    # Eyes
    eye_color = (0, 0, 0)  # Black eyes
    draw.ellipse([45, 45, 55, 55], fill=eye_color)  # Left eye
    draw.ellipse([73, 45, 83, 55], fill=eye_color)  # Right eye
    
    # Nose
    nose_color = (255, 192, 203) if enabled else (192, 192, 192)  # Pink for enabled, light gray for disabled
    draw.ellipse([62, 60, 66, 64], fill=nose_color)
    
    # Mouth
    draw.arc([50, 65, 78, 75], 0, 180, fill=eye_color, width=2)
    
    # Whiskers
    whisker_color = (200, 200, 200) if enabled else (150, 150, 150)
    draw.line([50, 65, 30, 60], fill=whisker_color, width=1)  # Left whisker 1
    draw.line([50, 70, 30, 70], fill=whisker_color, width=1)  # Left whisker 2
    draw.line([78, 65, 98, 60], fill=whisker_color, width=1)  # Right whisker 1
    draw.line([78, 70, 98, 70], fill=whisker_color, width=1)  # Right whisker 2
    
    return image

# Create enabled icon
enabled_icon = create_icon(enabled=True)
enabled_icon.save('icon.png')

# Create disabled icon
disabled_icon = create_icon(enabled=False)
disabled_icon.save('icon_disabled.png') 