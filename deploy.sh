#!/bin/bash

echo "🚀 Multi-Platform Deployment Script for ALEX.IO"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to mobile directory
cd mobile || exit 1

print_status "Installing dependencies..."
npm install

print_status "Building for all platforms..."
npm run build:all

if [ $? -eq 0 ]; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Go back to root directory
cd ..

print_status "Available deployment options:"
echo "1. Web (Vercel)"
echo "2. Web (Netlify)"
echo "3. Android (EAS Build)"
echo "4. iOS (EAS Build)"
echo "5. All platforms"

read -p "Choose deployment option (1-5): " choice

case $choice in
    1)
        print_status "Deploying to Vercel..."
        vercel --prod
        ;;
    2)
        print_status "Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=mobile/dist
        else
            print_warning "Netlify CLI not installed. Installing..."
            npm install -g netlify-cli
            netlify deploy --prod --dir=mobile/dist
        fi
        ;;
    3)
        print_status "Building Android app with EAS..."
        cd mobile
        npx eas build --platform android --profile production
        ;;
    4)
        print_status "Building iOS app with EAS..."
        cd mobile
        npx eas build --platform ios --profile production
        ;;
    5)
        print_status "Deploying to all platforms..."
        # Web deployment
        print_status "1/3 Deploying to Vercel..."
        vercel --prod
        
        # Mobile builds
        cd mobile
        print_status "2/3 Building Android app..."
        npx eas build --platform android --profile production --non-interactive &
        
        print_status "3/3 Building iOS app..."
        npx eas build --platform ios --profile production --non-interactive &
        
        wait
        print_success "All deployments initiated!"
        ;;
    *)
        print_error "Invalid option selected!"
        exit 1
        ;;
esac

print_success "Deployment process completed!"