#!/bin/bash

# Versoll Books Video Reveal - Helper Script
# This script provides common commands for the video project

set -e

echo "🎬 Versoll Books Video Reveal - Helper Script"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if in correct directory
if [ ! -f "package.json" ] || [ ! -f "remotion.config.ts" ]; then
    print_error "Please run this script from the video-reveal directory"
    exit 1
fi

# Display menu
show_menu() {
    echo ""
    echo "Available commands:"
    echo ""
    echo "  1) 📦 Install dependencies"
    echo "  2) 🚀 Start development server"
    echo "  3) 🎬 Build video (MP4)"
    echo "  4) 🖼️  Build video (PNG frames)"
    echo "  5) 🧹 Clean build artifacts"
    echo "  6) 📊 Check for updates"
    echo "  7) 🐛 Check for issues"
    echo "  8) ℹ️  Show project info"
    echo "  9) 🎨 Preview with different resolution"
    echo "  0) ❌ Exit"
    echo ""
    echo -n "Select option: "
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Start development server
start_dev() {
    print_info "Starting Remotion Studio..."
    print_info "Open http://localhost:3000 in your browser"
    npm start
}

# Build MP4
build_mp4() {
    print_info "Building video as MP4..."
    mkdir -p out
    npm run build
    if [ -f "out/video.mp4" ]; then
        print_success "Video built successfully: out/video.mp4"
        ls -lh out/video.mp4
    else
        print_error "Video build failed"
    fi
}

# Build PNG frames
build_frames() {
    print_info "Building video as PNG frames..."
    mkdir -p out
    npx remotion render VideoReveal main out/frame-%04d.png --image-sequence
    print_success "Frames built successfully in out/"
    ls -lh out/ | head -10
}

# Clean build artifacts
clean() {
    print_info "Cleaning build artifacts..."
    rm -rf out/ dist/
    print_success "Build artifacts cleaned"
}

# Check for updates
check_updates() {
    print_info "Checking for Remotion updates..."
    npm outdated remotion @remotion/cli || print_success "All packages are up to date"
}

# Check for issues
check_issues() {
    print_info "Checking for common issues..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Run option 1 to install dependencies"
    fi
    
    # Check if src files exist
    if [ ! -f "src/VideoReveal.tsx" ]; then
        print_error "src/VideoReveal.tsx not found"
    else
        print_success "src/VideoReveal.tsx exists"
    fi
    
    # Check if index.tsx is properly configured
    if grep -q "<Composition" src/index.tsx; then
        print_success "Composition properly configured in src/index.tsx"
    else
        print_warning "Composition may not be properly configured"
    fi
    
    # Check TypeScript configuration
    if [ -f "tsconfig.json" ]; then
        print_success "tsconfig.json exists"
    else
        print_warning "tsconfig.json not found"
    fi
}

# Show project info
show_info() {
    print_info "Project Information"
    echo ""
    echo "Name: Versoll Books - Product Reveal Video"
    echo "Technology: Remotion (React-based video)"
    echo ""
    echo "Video Settings:"
    echo "  Duration: 300 frames (5 seconds)"
    echo "  FPS: 60"
    echo "  Resolution: 1920x1080 (Full HD)"
    echo ""
    echo "Project Structure:"
    echo "  src/VideoReveal.tsx - Main video component"
    echo "  src/index.tsx - Composition registration"
    echo "  src/components/ - Reusable animation components"
    echo ""
    echo "Output:"
    echo "  Default: out/video.mp4"
    echo "  Format: MP4 (H.264)"
    echo "  Quality: 90%"
    echo ""
    echo "Documentation:"
    echo "  README.md - Getting started guide"
    echo "  CUSTOMIZATION.md - Customization guide"
    echo ""
}

# Preview with different resolution
preview_resolution() {
    echo ""
    echo "Select resolution:"
    echo "  1) 1920x1080 (Full HD)"
    echo "  2) 1280x720 (HD)"
    echo "  3) 3840x2160 (4K)"
    echo "  4) 1080x1920 (Portrait)"
    echo ""
    echo -n "Select option: "
    read -r choice
    
    case $choice in
        1)
            WIDTH=1920
            HEIGHT=1080
            ;;
        2)
            WIDTH=1280
            HEIGHT=720
            ;;
        3)
            WIDTH=3840
            HEIGHT=2160
            ;;
        4)
            WIDTH=1080
            HEIGHT=1920
            ;;
        *)
            print_error "Invalid option"
            return
            ;;
    esac
    
    print_info "Starting preview at ${WIDTH}x${HEIGHT}..."
    print_info "Note: This is a temporary preview. To make permanent changes, edit src/index.tsx"
    npx remotion studio --props="{}" --composition="VideoReveal"
}

# Main loop
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            install_deps
            ;;
        2)
            start_dev
            ;;
        3)
            build_mp4
            ;;
        4)
            build_frames
            ;;
        5)
            clean
            ;;
        6)
            check_updates
            ;;
        7)
            check_issues
            ;;
        8)
            show_info
            ;;
        9)
            preview_resolution
            ;;
        0)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please try again."
            ;;
    esac
done
