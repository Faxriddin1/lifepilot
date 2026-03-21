# SSH Key Setup Script for Windows PowerShell
# Run this locally to generate SSH keys for GitHub Actions deployment
# Usage: powershell -ExecutionPolicy Bypass -File setup-ssh-keys.ps1

Write-Host "🔑 GitHub Actions SSH Key Generator" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

$keyName = "github-deploy"
$sshDir = "$env:USERPROFILE\.ssh"
$keyPath = "$sshDir\$keyName"

# Ensure .ssh directory exists
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "✓ Created .ssh directory"
}

# Check if key already exists
if (Test-Path $keyPath) {
    $response = Read-Host "SSH key already exists at $keyPath. Overwrite? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Aborted."
        exit 1
    }
}

# Generate SSH key using ssh-keygen
Write-Host "Generating SSH key (ed25519)..."
$process = Start-Process ssh-keygen -ArgumentList @(
    "-t", "ed25519",
    "-f", "`"$keyPath`"",
    "-C", "github-actions-deploy",
    "-N", ""
) -NoNewWindow -PassThru -Wait

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate SSH key" -ForegroundColor Red
    Write-Host "Make sure 'ssh-keygen' is available (Git for Windows or Windows 11 OpenSSH)"
    exit 1
}

Write-Host ""
Write-Host "✅ SSH key generated!" -ForegroundColor Green
Write-Host ""

# Display private key
Write-Host "📋 Private Key (add to GitHub as GCP_SSH_KEY):" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Get-Content $keyPath
Write-Host ""
Write-Host ""

# Display public key
Write-Host "🔐 Public Key (add to VM's ~/.ssh/authorized_keys):" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Get-Content "$keyPath.pub"
Write-Host ""
Write-Host ""

# Get SSH known hosts
Write-Host "🖥️  Getting SSH host keys from 34.122.146.176..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow

try {
    $knownHosts = & ssh-keyscan -t "ed25519,rsa,ecdsa" 34.122.146.176 2>$null
    
    if ($knownHosts) {
        Write-Host ""
        Write-Host "📋 Known Hosts (add to GitHub as GCP_SSH_KNOWN_HOSTS):" -ForegroundColor Cyan
        Write-Host "=======================================================" -ForegroundColor Cyan
        Write-Host $knownHosts
        Write-Host ""
        Write-Host ""
        
        Write-Host "ℹ️  Adding to local known_hosts..." -ForegroundColor Gray
        Add-Content "$sshDir\known_hosts" $knownHosts 2>$null
        Write-Host "✓ Added" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not get host keys. The VM may not be running." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error getting host keys: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""
Write-Host "📝 Next Steps - Add to GitHub:" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: https://github.com/Faxriddin1/productflow/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "2. Create these 4 secrets:" -ForegroundColor White
Write-Host ""
Write-Host "   Secret Name            │ Value" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   GCP_VM_HOST            │ 34.122.146.176" -ForegroundColor White
Write-Host "   GCP_VM_USER            │ root (or your username)" -ForegroundColor White
Write-Host "   GCP_SSH_KEY            │ [private key content above]" -ForegroundColor White
Write-Host "   GCP_SSH_KNOWN_HOSTS    │ [known hosts content above]" -ForegroundColor White
Write-Host ""
Write-Host ""
Write-Host "3. To add public key to VM:" -ForegroundColor White
Write-Host ""
Write-Host "   a. Get your public key:" -ForegroundColor Gray
Write-Host "      Get-Content $keyPath.pub | Set-Clipboard" -ForegroundColor Gray
Write-Host ""
Write-Host "   b. SSH into VM:" -ForegroundColor Gray
Write-Host "      ssh root@34.122.146.176" -ForegroundColor Gray
Write-Host ""
Write-Host "   c. Add to authorized_keys:" -ForegroundColor Gray
Write-Host "      mkdir -p ~/.ssh" -ForegroundColor Gray
Write-Host "      echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "      chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host ""
Write-Host ""
Write-Host "4. Test SSH connection:" -ForegroundColor White
Write-Host "   ssh -i $keyPath root@34.122.146.176 `"echo 'SSH works!'`"" -ForegroundColor Gray
Write-Host ""
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Setup the Google Cloud VM" -ForegroundColor Green
Write-Host "  Download and run: setup-gcp-vm.sh on your VM" -ForegroundColor Gray
