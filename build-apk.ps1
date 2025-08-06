
# Build and sign APK

# Navigate to project root
Set-Location -Path $PSScriptRoot

# Read current version from version.json
$versionJson = Get-Content "version.json" | ConvertFrom-Json
$currentVersion = $versionJson.version
$buildNumber = $versionJson.buildNumber

# Verify and setup Capacitor
Write-Host "Verifying Capacitor setup..."

# Check if Capacitor CLI is installed
$capacitorInstalled = npm list @capacitor/cli 2>$null
if (!$capacitorInstalled) {
    Write-Host "Installing Capacitor dependencies..."
    npm install @capacitor/core @capacitor/cli --save-dev
}

# Check if Capacitor config exists
if (!(Test-Path "capacitor.config.json")) {
    Write-Host "Initializing Capacitor configuration..."
    npx cap init
}

# Check if Android platform is added
$androidPlatform = npm list @capacitor/android 2>$null
if (!$androidPlatform) {
    Write-Host "Adding Android platform..."
    npm install @capacitor/android
    npx cap add android
}

# Verify Capacitor configuration
Write-Host "Verifying Capacitor configuration..."
npx cap doctor

# Build web assets
Write-Host "Building web assets..."
npm run build

# Sync Capacitor
Write-Host "Syncing Capacitor..."
npx cap sync android

# Increment version logic
$versionParts = $currentVersion.Split('.')
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Increment patch, roll over to minor if patch > 9
if ($patch -lt 9) {
    $patch++
} else {
    $patch = 0
    if ($minor -lt 9) {
        $minor++
    } else {
        $minor = 0
        $major++
    }
}

$newVersion = "$major.$minor.$patch"
$newBuildNumber = $buildNumber + 1

# Update version.json
$updatedVersionJson = @{
    version = $newVersion
    buildNumber = $newBuildNumber
}
$updatedVersionJson | ConvertTo-Json | Set-Content "version.json"
Write-Host "Updated version.json to v$newVersion (build $newBuildNumber)"

# Update src/utils/version.ts to include the new version as fallback
$versionTsPath = "src/utils/version.ts"
$versionTsContent = Get-Content $versionTsPath -Raw
$updatedVersionTs = $versionTsContent -replace 'cachedVersion = "1\.0\.0";', "cachedVersion = `"$newVersion`";"
Set-Content -Path $versionTsPath -Value $updatedVersionTs
Write-Host "Updated src/utils/version.ts fallback to v$newVersion"

# Update versionName and versionCode in android/app/build.gradle
$buildGradlePath = "android/app/build.gradle"
$lines = Get-Content $buildGradlePath
$updated = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'versionName\s+".*"') {
        $lines[$i] = $lines[$i] -replace 'versionName\s+".*"', "versionName `"$newVersion`""
        Write-Host "Updated versionName to $newVersion in build.gradle."
        $updated = $true
    }
    if ($lines[$i] -match 'versionCode\s+\d+') {
        $lines[$i] = $lines[$i] -replace 'versionCode\s+\d+', "versionCode $newBuildNumber"
        Write-Host "Updated versionCode to $newBuildNumber in build.gradle."
    }
}

if ($updated) {
    Set-Content -Path $buildGradlePath -Value $lines
} else {
    Write-Host "versionName not found in build.gradle - version may not be updated."
}

# Navigate to Android directory
Write-Host "Building signed APK..."
Set-Location -Path android

# Build signed APK with keystore
Write-Host "Building signed APK..."
./gradlew assembleRelease

# Create APK filename with consistent naming for update detection
$timestamp = Get-Date -Format 'yyyyMMdd_HHmm'
$apkFileName = "app-release-v$newVersion-$timestamp.apk"

# Copy APK to V:\app-techpinoy-com\dist\apk\...
Write-Host "Copying APK to V:\\apk\\..."
Copy-Item -Path "app/build/outputs/apk/release/app-release.apk" -Destination "V:\\apk\\$apkFileName"

# Create version info JSON file
Write-Host "Creating version info JSON..."
$versionInfo = @{
    version = $newVersion
    buildNumber = $newBuildNumber
    releaseDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    downloadUrl = "https://app.techpinoy.com/apk/$apkFileName"
    fileSize = (Get-Item "V:\\apk\\$apkFileName").Length
    whatsNew = @(
        "Performance improvements and bug fixes",
        "Enhanced user interface",
        "Updated dependencies"
    )
    updateType = "feature"
    isRequired = $false
}

$versionInfoJson = $versionInfo | ConvertTo-Json -Depth 3
$versionInfoFileName = "version-info-v$newVersion.json"
Set-Content -Path "V:\\apk\\$versionInfoFileName" -Value $versionInfoJson

Write-Host "Build completed successfully! Files created:"
Write-Host "- Android directory: android/app/build/outputs/apk/release/app-release.apk"
Write-Host "- V:\\apk\\$apkFileName"
Write-Host "- V:\\apk\\$versionInfoFileName"
Write-Host "Version: v$newVersion (Build: $newBuildNumber)"
