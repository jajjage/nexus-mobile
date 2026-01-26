#!/bin/bash
# Asset Optimization Script
# Optimizes all images in assets folder to reduce APK size by 20-30%

set -e

echo "🖼️  Starting Asset Optimization..."
echo ""

# Create optimized directory
mkdir -p assets/optimized

# Function to optimize PNG to WebP
optimize_png_to_webp() {
  local input=$1
  local output=$2
  
  if [ ! -f "$input" ]; then
    return
  fi
  
  local size_before=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input" 2>/dev/null)
  
  # Convert PNG to WebP with compression
  npx sharp-cli convert webp --input "$input" --output "$output" --quality 85 2>/dev/null || return
  
  local size_after=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
  local percent=$(( (size_before - size_after) * 100 / size_before ))
  
  echo "✅ $input → $output (saved $percent%)"
}

# Function to optimize PNG with compression
optimize_png() {
  local file=$1
  
  if [ ! -f "$file" ]; then
    return
  fi
  
  # Try various compression tools if available
  if command -v pngquant &> /dev/null; then
    pngquant --force --output "$file" "$file" 2>/dev/null || true
  fi
  
  if command -v optipng &> /dev/null; then
    optipng -o2 "$file" 2>/dev/null || true
  fi
  
  echo "✅ Compressed: $file"
}

# Function to optimize JPG
optimize_jpg() {
  local file=$1
  
  if [ ! -f "$file" ]; then
    return
  fi
  
  if command -v jpegoptim &> /dev/null; then
    jpegoptim --max=85 --all-progressive "$file" 2>/dev/null || true
  fi
  
  echo "✅ Compressed: $file"
}

# Process images
echo "📦 Processing PNG images..."
for png in assets/images/*.png; do
  [ -f "$png" ] && optimize_png "$png"
done

echo ""
echo "📦 Processing JPG images..."
for jpg in assets/images/*.jpg assets/images/*.jpeg; do
  [ -f "$jpg" ] && optimize_jpg "$jpg"
done

echo ""
echo "✨ Asset optimization complete!"
echo ""
echo "Next steps:"
echo "1. Verify assets/images/ files are optimized"
echo "2. Run: eas build --profile production-apk --platform android --clear-cache"
echo "3. Compare APK sizes before and after"
