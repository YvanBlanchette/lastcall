# ============================================================
#  AERIA - Convertisseur universel d'images (PowerShell + FFmpeg)
#  Choisis un format d'entree et un format de sortie.
#
#  Usage interactif :
#     .\Universal-Image-Converter.ps1
#
#  Usage direct :
#     .\Universal-Image-Converter.ps1 -From tiff -To webp
#     .\Universal-Image-Converter.ps1 -From all -To avif -Quality 70 -Recurse
#     .\Universal-Image-Converter.ps1 -From png -To jpg -KeepOriginals
# ============================================================

[CmdletBinding()]
param(
    [string]$From,
    [string]$To,
    [int]$Quality = 85,
    [string]$Path = ".",
    [switch]$Recurse,
    [switch]$KeepOriginals,
    [string]$OutputDir = "converti",
    [string]$ArchiveDir = "original"
)

$ErrorActionPreference = "Continue"

# ------------------------------------------------------------
#  CATALOGUE DES FORMATS
# ------------------------------------------------------------
# In  = utilisable en entree | Out = utilisable en sortie
# Alpha = conserve la transparence
$Catalog = [ordered]@{
    "webp" = @{ Ext = @(".webp");         Label = "WebP";       In = $true; Out = $true;  Alpha = $true  }
    "jpg"  = @{ Ext = @(".jpg", ".jpeg"); Label = "JPEG";       In = $true; Out = $true;  Alpha = $false }
    "png"  = @{ Ext = @(".png");          Label = "PNG";        In = $true; Out = $true;  Alpha = $true  }
    "avif" = @{ Ext = @(".avif");         Label = "AVIF";       In = $true; Out = $true;  Alpha = $true  }
    "tiff" = @{ Ext = @(".tiff", ".tif"); Label = "TIFF";       In = $true; Out = $true;  Alpha = $true  }
    "bmp"  = @{ Ext = @(".bmp");          Label = "BMP";        In = $true; Out = $true;  Alpha = $false }
    "gif"  = @{ Ext = @(".gif");          Label = "GIF";        In = $true; Out = $true;  Alpha = $true  }
    "jxl"  = @{ Ext = @(".jxl");          Label = "JPEG XL";    In = $true; Out = $true;  Alpha = $true  }
    "tga"  = @{ Ext = @(".tga");          Label = "TGA";        In = $true; Out = $true;  Alpha = $true  }
    "heic" = @{ Ext = @(".heic",".heif"); Label = "HEIC/HEIF";  In = $true; Out = $false; Alpha = $true  }
    "dng"  = @{ Ext = @(".dng");          Label = "DNG (RAW)";  In = $true; Out = $false; Alpha = $false }
    "ppm"  = @{ Ext = @(".ppm");          Label = "PPM";        In = $true; Out = $true;  Alpha = $false }
}

function Get-AllInputExtensions {
    $list = @()
    foreach ($k in $Catalog.Keys) { if ($Catalog[$k].In) { $list += $Catalog[$k].Ext } }
    return $list
}

function Resolve-FormatKey {
    param([string]$Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return $null }
    $n = $Name.Trim().ToLower().TrimStart('.')
    if ($n -eq "jpeg") { $n = "jpg" }
    if ($n -eq "tif")  { $n = "tiff" }
    if ($n -eq "heif") { $n = "heic" }
    if ($Catalog.Contains($n)) { return $n }
    return $null
}

# ------------------------------------------------------------
#  ARGUMENTS FFMPEG PAR FORMAT DE SORTIE
# ------------------------------------------------------------
function Get-EncoderArgs {
    param([string]$Target, [int]$Q, [bool]$NeedsFlatten)

    $args = @()

    # Aplatit la transparence sur fond blanc si le format cible ne gere pas l'alpha
    if ($NeedsFlatten) {
        $args += @("-filter_complex", "color=white:s=16x16,format=rgb24[bg];[bg][0:v]scale2ref[bg][img];[bg][img]overlay=shortest=1:format=auto,setsar=1")
    }

    switch ($Target) {
        "webp" {
            $args += @("-c:v", "libwebp", "-compression_level", "6", "-preset", "photo", "-loop", "0")
            if ($Q -ge 100) { $args += @("-lossless", "1") }
            else            { $args += @("-quality", "$Q") }
        }
        "jpg" {
            # q:v : 2 = meilleur, 31 = pire
            $qv = [math]::Max(2, [math]::Min(31, [int][math]::Round(31 - ($Q / 100.0) * 29)))
            $args += @("-c:v", "mjpeg", "-q:v", "$qv", "-pix_fmt", "yuvj420p")
        }
        "png" {
            $args += @("-c:v", "png", "-compression_level", "100", "-pred", "mixed")
        }
        "avif" {
            $crf = [math]::Max(0, [math]::Min(63, [int][math]::Round((100 - $Q) * 1.2)))
            $args += @("-c:v", "libaom-av1", "-crf", "$crf", "-b:v", "0", "-cpu-used", "5", "-still-picture", "1")
        }
        "jxl" {
            $dist = [math]::Round((100 - $Q) / 6.67, 1)
            if ($Q -ge 100) { $dist = 0 }
            $args += @("-c:v", "libjxl", "-distance", "$dist", "-effort", "7")
        }
        "tiff" {
            $args += @("-c:v", "tiff", "-compression_algo", "deflate")
        }
        "bmp"  { $args += @("-c:v", "bmp") }
        "tga"  { $args += @("-c:v", "targa") }
        "ppm"  { $args += @("-c:v", "ppm") }
        "gif"  {
            $args += @("-filter_complex", "[0:v]split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=dither=sierra2_4a", "-loop", "0")
        }
    }
    return $args
}

# ------------------------------------------------------------
#  HEADER
# ------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AERIA - Convertisseur universel d'images" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verifie FFmpeg
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "[ERREUR] FFmpeg n'est pas trouve dans le PATH." -ForegroundColor Red
    Write-Host "Installe-le avec : winget install ffmpeg" -ForegroundColor Yellow
    Read-Host "Appuie sur Entree pour fermer"
    exit 1
}

# ------------------------------------------------------------
#  SCAN DU DOSSIER
# ------------------------------------------------------------
$rootPath = (Resolve-Path $Path).Path
$allExtensions = Get-AllInputExtensions

$gciParams = @{ Path = $rootPath; File = $true; ErrorAction = "SilentlyContinue" }
if ($Recurse) { $gciParams.Recurse = $true }

$allFiles = Get-ChildItem @gciParams | Where-Object {
    $allExtensions -contains $_.Extension.ToLower() -and
    $_.FullName -notlike "*\$OutputDir\*" -and
    $_.FullName -notlike "*\$ArchiveDir\*"
}

if ($allFiles.Count -eq 0) {
    Write-Host "[INFO] Aucune image trouvee dans : $rootPath" -ForegroundColor Yellow
    Write-Host "Formats reconnus : $(($Catalog.Keys | Where-Object { $Catalog[$_].In }) -join ', ')" -ForegroundColor Gray
    Read-Host "Appuie sur Entree pour fermer"
    exit 0
}

# Regroupe par format logique
$available = [ordered]@{}
foreach ($key in $Catalog.Keys) {
    if (-not $Catalog[$key].In) { continue }
    $matched = $allFiles | Where-Object { $Catalog[$key].Ext -contains $_.Extension.ToLower() }
    if ($matched.Count -gt 0) { $available[$key] = @($matched) }
}

# ------------------------------------------------------------
#  CHOIX DU FORMAT SOURCE
# ------------------------------------------------------------
$fromKey = Resolve-FormatKey $From
if ($From -and $From.Trim().ToLower() -in @("all", "tout", "tous", "*")) { $fromKey = "all" }

if (-not $fromKey) {
    Write-Host "[1/3] FORMAT D'ENTREE - $($allFiles.Count) image(s) detectee(s) dans le dossier" -ForegroundColor Green
    Write-Host ""
    $i = 0
    $menuMap = @{}
    foreach ($key in $available.Keys) {
        $i++
        $menuMap["$i"] = $key
        $label = $Catalog[$key].Label.PadRight(12)
        Write-Host ("   [{0}] {1} {2} fichier(s)" -f $i, $label, $available[$key].Count) -ForegroundColor Gray
    }
    Write-Host ("   [0] {0} {1} fichier(s)" -f "TOUS".PadRight(12), $allFiles.Count) -ForegroundColor Yellow
    Write-Host ""

    do {
        $choice = Read-Host "   Ton choix"
        if ($choice -eq "0") { $fromKey = "all" }
        elseif ($menuMap.ContainsKey($choice)) { $fromKey = $menuMap[$choice] }
        else { Write-Host "   Choix invalide." -ForegroundColor Red }
    } while (-not $fromKey)
    Write-Host ""
}

if ($fromKey -eq "all") {
    $sourceFiles = @($allFiles)
    $fromLabel = "TOUS LES FORMATS"
} else {
    if (-not $available.Contains($fromKey)) {
        Write-Host "[ERREUR] Aucun fichier $($Catalog[$fromKey].Label) dans ce dossier." -ForegroundColor Red
        Read-Host "Appuie sur Entree pour fermer"
        exit 1
    }
    $sourceFiles = @($available[$fromKey])
    $fromLabel = $Catalog[$fromKey].Label
}

# ------------------------------------------------------------
#  CHOIX DU FORMAT DE SORTIE
# ------------------------------------------------------------
$toKey = Resolve-FormatKey $To
if ($toKey -and -not $Catalog[$toKey].Out) {
    Write-Host "[ERREUR] $($Catalog[$toKey].Label) n'est pas supporte en sortie." -ForegroundColor Red
    $toKey = $null
}

if (-not $toKey) {
    Write-Host "[2/3] FORMAT DE SORTIE" -ForegroundColor Green
    Write-Host ""
    $i = 0
    $outMap = @{}
    foreach ($key in $Catalog.Keys) {
        if (-not $Catalog[$key].Out) { continue }
        $i++
        $outMap["$i"] = $key
        $alpha = if ($Catalog[$key].Alpha) { "transparence OK" } else { "pas de transparence" }
        Write-Host ("   [{0}] {1} ({2})" -f $i, $Catalog[$key].Label.PadRight(10), $alpha) -ForegroundColor Gray
    }
    Write-Host ""

    do {
        $choice = Read-Host "   Ton choix"
        if ($outMap.ContainsKey($choice)) { $toKey = $outMap[$choice] }
        else { Write-Host "   Choix invalide." -ForegroundColor Red }
    } while (-not $toKey)
    Write-Host ""

    # ---- Qualite ----
    Write-Host "[3/3] QUALITE (1-100, Entree = $Quality)" -ForegroundColor Green
    $qInput = Read-Host "   Qualite"
    if ($qInput -match '^\d+$') { $Quality = [math]::Max(1, [math]::Min(100, [int]$qInput)) }
    Write-Host ""
}

$targetExt = $Catalog[$toKey].Ext[0]
$toLabel = $Catalog[$toKey].Label

# Enleve les fichiers deja au bon format (sauf si on veut re-encoder explicitement)
$sameFormat = @($sourceFiles | Where-Object { $Catalog[$toKey].Ext -contains $_.Extension.ToLower() })
if ($sameFormat.Count -gt 0 -and $fromKey -eq "all") {
    $sourceFiles = @($sourceFiles | Where-Object { $Catalog[$toKey].Ext -notcontains $_.Extension.ToLower() })
    Write-Host "[INFO] $($sameFormat.Count) fichier(s) deja en $toLabel ignore(s)." -ForegroundColor Gray
}

if ($sourceFiles.Count -eq 0) {
    Write-Host "[INFO] Rien a convertir." -ForegroundColor Yellow
    Read-Host "Appuie sur Entree pour fermer"
    exit 0
}

# La transparence sera-t-elle perdue ?
$needsFlatten = -not $Catalog[$toKey].Alpha

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  $fromLabel  ->  $toLabel   (qualite $Quality)" -ForegroundColor Cyan
Write-Host "  $($sourceFiles.Count) fichier(s) a traiter" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
#  DOSSIERS
# ------------------------------------------------------------
$outRoot = Join-Path $rootPath $OutputDir
$archiveRoot = Join-Path $rootPath $ArchiveDir
if (-not (Test-Path $outRoot)) { New-Item -ItemType Directory -Path $outRoot | Out-Null }
if (-not $KeepOriginals -and -not (Test-Path $archiveRoot)) { New-Item -ItemType Directory -Path $archiveRoot | Out-Null }

# ------------------------------------------------------------
#  CONVERSION
# ------------------------------------------------------------
$success = 0
$failed = 0
$totalSavedBytes = 0
$index = 0

foreach ($file in $sourceFiles) {
    $index++
    Write-Host "----------------------------------------------------------"
    Write-Host "[$index/$($sourceFiles.Count)] $($file.Name)" -ForegroundColor Cyan

    $sizeBefore = $file.Length

    # Conserve l'arborescence si -Recurse
    $relativeDir = ""
    if ($Recurse) {
        $parent = Split-Path $file.FullName -Parent
        if ($parent -ne $rootPath) { $relativeDir = $parent.Substring($rootPath.Length).TrimStart('\') }
    }

    $destDir = if ($relativeDir) { Join-Path $outRoot $relativeDir } else { $outRoot }
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

    $outputPath = Join-Path $destDir "$($file.BaseName)$targetExt"
    if (Test-Path $outputPath) {
        $counter = 1
        do {
            $outputPath = Join-Path $destDir "$($file.BaseName)-$counter$targetExt"
            $counter++
        } while (Test-Path $outputPath)
        Write-Host "   [INFO] Nom deja pris, utilise : $(Split-Path $outputPath -Leaf)" -ForegroundColor Yellow
    }

    # --- Tentative 1 : avec aplatissement si necessaire ---
    $ffArgs = @("-hide_banner", "-loglevel", "error", "-y", "-i", $file.FullName)
    $ffArgs += Get-EncoderArgs -Target $toKey -Q $Quality -NeedsFlatten $needsFlatten
    $ffArgs += $outputPath

    $ffOutput = & ffmpeg @ffArgs 2>&1
    $code = $LASTEXITCODE

    # --- Tentative 2 : sans filtre, au cas ou le filtre pose probleme ---
    if ($code -ne 0 -and $needsFlatten) {
        $ffArgs = @("-hide_banner", "-loglevel", "error", "-y", "-i", $file.FullName)
        $ffArgs += Get-EncoderArgs -Target $toKey -Q $Quality -NeedsFlatten $false
        $ffArgs += $outputPath
        $ffOutput = & ffmpeg @ffArgs 2>&1
        $code = $LASTEXITCODE
    }

    if ($code -ne 0) {
        Write-Host "   [ECHEC] Code: $code" -ForegroundColor Red
        $detail = ($ffOutput | Select-Object -Last 1)
        if ($detail) { Write-Host "   $detail" -ForegroundColor DarkRed }
        $failed++
        continue
    }

    $outputFile = Get-Item $outputPath -ErrorAction SilentlyContinue
    if (-not $outputFile -or $outputFile.Length -eq 0) {
        Write-Host "   [ECHEC] Fichier de sortie vide ou introuvable" -ForegroundColor Red
        $failed++
        continue
    }

    $sizeAfter = $outputFile.Length
    $saved = $sizeBefore - $sizeAfter
    $percent = [math]::Round(($saved / $sizeBefore) * 100, 1)
    $beforeKb = [math]::Round($sizeBefore / 1024)
    $afterKb = [math]::Round($sizeAfter / 1024)
    $savedKb = [math]::Round($saved / 1024)

    if ($saved -lt 0) {
        Write-Host "   [OK] $beforeKb KB => $afterKb KB (PLUS GROS de $([math]::Abs($savedKb)) KB)" -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] $beforeKb KB => $afterKb KB (economise $savedKb KB / -$percent%)" -ForegroundColor Green
    }

    # Archive l'original
    if (-not $KeepOriginals) {
        $archDir = if ($relativeDir) { Join-Path $archiveRoot $relativeDir } else { $archiveRoot }
        if (-not (Test-Path $archDir)) { New-Item -ItemType Directory -Path $archDir -Force | Out-Null }

        $archiveDest = Join-Path $archDir $file.Name
        if (Test-Path $archiveDest) {
            $counter = 1
            do {
                $archiveDest = Join-Path $archDir "$($file.BaseName)-$counter$($file.Extension)"
                $counter++
            } while (Test-Path $archiveDest)
        }
        Move-Item -Path $file.FullName -Destination $archiveDest -Force
    }

    $success++
    $totalSavedBytes += $saved
}

# ------------------------------------------------------------
#  RESUME
# ------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RESUME : $fromLabel -> $toLabel" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Convertis : $success / $($sourceFiles.Count)" -ForegroundColor Green
Write-Host "  Echecs    : $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })

$totalSavedMb = [math]::Round($totalSavedBytes / 1MB, 1)
$totalSavedGb = [math]::Round($totalSavedBytes / 1GB, 2)

if ($totalSavedBytes -lt 0) {
    Write-Host "  Espace : +$([math]::Abs($totalSavedMb)) MB (la sortie est plus grosse que les sources)" -ForegroundColor Yellow
} else {
    Write-Host "  Economise : $totalSavedMb MB ($totalSavedGb GB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "  Convertis : .\$OutputDir\" -ForegroundColor Gray
if (-not $KeepOriginals) { Write-Host "  Originaux : .\$ArchiveDir\" -ForegroundColor Gray }
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Appuie sur Entree pour fermer"
