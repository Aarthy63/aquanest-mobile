# Launch AquaNest on a full phone-sized Android emulator window
$ErrorActionPreference = "Continue"
$sdk = "D:\Android\Sdk"
$jdk = "$env:LOCALAPPDATA\Android\jdk-17"
$apk = "D:\Android\Expo-Go-58.0.5.apk"
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:ANDROID_AVD_HOME = "D:\Android\.android\avd"
$env:ANDROID_USER_HOME = "D:\Android\.android"
$env:Path = "$jdk\bin;$sdk\cmdline-tools\latest\bin;$sdk\platform-tools;$sdk\emulator;$env:Path"

try {
  $null = Invoke-WebRequest "http://127.0.0.1:4000/api/health" -UseBasicParsing -TimeoutSec 2
} catch {
  Write-Host "Starting backend API..."
  Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory "$PSScriptRoot\..\backend" -WindowStyle Minimized
  Start-Sleep -Seconds 2
}

$running = adb devices 2>$null | Select-String "emulator-"
if (-not $running) {
  Write-Host "Starting Pixel phone emulator (1080x2400)..."
  Start-Process -FilePath "$sdk\emulator\emulator.exe" -ArgumentList @(
    "-avd", "Pixel_6_API_34",
    "-gpu", "swiftshader_indirect",
    "-netdelay", "none",
    "-netspeed", "full"
  )
  adb wait-for-device
  $deadline = (Get-Date).AddMinutes(3)
  do {
    Start-Sleep -Seconds 3
    $boot = adb shell getprop sys.boot_completed 2>$null
  } while ($boot -notmatch "1" -and (Get-Date) -lt $deadline)
}

$hasExpo = adb shell pm list packages | Select-String "host.exp.exponent"
if (-not $hasExpo) {
  if (-not (Test-Path $apk)) {
    Write-Host "Downloading Expo Go..."
    curl.exe -L -o $apk "https://github.com/expo/expo-go-releases/releases/download/Expo-Go-58.0.5/Expo-Go-58.0.5.apk"
  }
  Write-Host "Installing Expo Go..."
  adb install -r $apk
}

adb reverse tcp:4000 tcp:4000 | Out-Null
adb reverse tcp:8081 tcp:8081 | Out-Null

Write-Host "Opening AquaNest (full phone UI)..."
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" | Out-Null
Set-Location "$PSScriptRoot\..\mobile"
npx expo start --android
