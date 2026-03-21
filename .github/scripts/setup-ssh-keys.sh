#!/bin/bash

# SSH Key Setup Script
# Run this locally to generate SSH keys for GitHub Actions deployment
# Usage: bash setup-ssh-keys.sh

echo "🔑 GitHub Actions SSH Key Generator"
echo "===================================="
echo ""

KEY_NAME="github-deploy"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

# Check if key already exists
if [ -f "$KEY_PATH" ]; then
  read -p "SSH key already exists at $KEY_PATH. Overwrite? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Generate SSH key
echo "Generating SSH key (ed25519)..."
ssh-keygen -t ed25519 -f "$KEY_PATH" -C "github-actions-deploy" -N ""

echo ""
echo "✅ SSH key generated!"
echo ""
echo "📋 Private Key (add to GitHub as GCP_SSH_KEY):"
echo "=================================================="
cat "$KEY_PATH"
echo ""
echo ""
echo "🔐 Public Key (add to VM's ~/.ssh/authorized_keys):"
echo "====================================================="
cat "$KEY_PATH.pub"
echo ""
echo ""

# Generate SSH known hosts
echo "🖥️  Getting SSH host keys from 34.122.146.176..."
echo "=================================================="
echo "(Press Enter to continue or Ctrl+C to skip)"
read

KNOWN_HOSTS=$(ssh-keyscan -t ed25519,rsa,ecdsa 34.122.146.176 2>/dev/null)

if [ ! -z "$KNOWN_HOSTS" ]; then
  echo ""
  echo "📋 Known Hosts (add to GitHub as GCP_SSH_KNOWN_HOSTS):"
  echo "======================================================="
  echo "$KNOWN_HOSTS"
  echo ""
  echo ""
  echo "ℹ️  Adding to local ~/.ssh/known_hosts..."
  ssh-keyscan -t ed25519,rsa,ecdsa 34.122.146.176 >> "$HOME/.ssh/known_hosts" 2>/dev/null
  echo "✓ Added"
else
  echo "⚠️  Could not get host keys. Make sure the VM is running and accessible."
fi

echo ""
echo "📝 To add to GitHub:"
echo "===================="
echo "1. Go to: https://github.com/Faxriddin1/productflow/settings/secrets/actions"
echo ""
echo "2. Create these secrets:"
echo ""
echo "   GCP_VM_HOST              → 34.122.146.176"
echo "   GCP_VM_USER              → root (or your username)"
echo "   GCP_SSH_KEY              → [contents of private key above]"
echo "   GCP_SSH_KNOWN_HOSTS      → [contents of known hosts above]"
echo ""
echo "3. To add public key to VM, run:"
echo "   ssh root@34.122.146.176"
echo "   mkdir -p ~/.ssh"
echo "   nano ~/.ssh/authorized_keys"
echo "   # Paste the public key above"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo ""
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next: Run the GCP VM setup script"
echo "  bash .github/scripts/setup-gcp-vm.sh"
