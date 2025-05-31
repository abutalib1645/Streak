#!/bin/bash
set -e

echo "📁 Creating godpower-dashboard folder structure..."
mkdir -p godpower-dashboard/{backend/src/chains,frontend/public/icons,frontend/src/{components,pages,lib/web3-provider,lib/web3-modules,styles},wallets,logs}

echo "📝 Writing backend files..."