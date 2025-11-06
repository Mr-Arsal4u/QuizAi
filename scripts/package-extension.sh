#!/bin/bash

# Script to package the Chrome extension for distribution
# This creates a zip file with only the dist folder contents

cd "$(dirname "$0")/.."

# Build the extension first
echo "Building extension..."
npm run build

# Create package directory
PACKAGE_NAME="quizzkar-extension"
PACKAGE_DIR="package"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy dist contents to package directory
echo "Copying files to package directory..."
cp -r dist/* "$PACKAGE_DIR/"

# Create zip file
ZIP_NAME="${PACKAGE_NAME}-v$(node -p "require('./package.json').version").zip"
echo "Creating zip file: $ZIP_NAME"
cd "$PACKAGE_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.git*"
cd ..

echo "✓ Package created: $ZIP_NAME"
echo "✓ Package directory: $PACKAGE_DIR/"
echo ""
echo "To load in Chrome:"
echo "  1. Go to chrome://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the 'package' folder (or 'dist' folder)"
echo ""
echo "To publish:"
echo "  Upload the zip file: $ZIP_NAME"

