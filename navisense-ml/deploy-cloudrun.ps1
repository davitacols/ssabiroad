param(
    [string]$ProjectId = "pic2nav",
    [string]$ServiceName = "navisense-ml",
    [string]$Region = "us-east1",
    [string]$ImageName = "",
    [string]$EnvPath = "",
    [string]$KeyFile = "",
    [string]$SourceDir = "",
    [string]$Memory = "4Gi",
    [string]$Cpu = "2",
    [switch]$SkipBuild,
    [switch]$SkipAuth,
    [switch]$SkipDeploy,
    [switch]$SkipRetrain,
    [switch]$SkipVerify,
    [switch]$SkipEnvSync
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Find-GCloud {
    $command = Get-Command gcloud.cmd -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $fallback = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
    if (Test-Path $fallback) {
        return $fallback
    }

    throw "Unable to locate gcloud.cmd. Install the Google Cloud SDK first."
}

function Invoke-GCloud {
    param(
        [string]$GCloudPath,
        [string[]]$Arguments
    )

    & $GCloudPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud command failed: $($Arguments -join ' ')"
    }
}

function Parse-DotEnv {
    param([string]$Path)

    $values = @{}
    foreach ($line in Get-Content -Path $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Count -ne 2) {
            continue
        }

        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if ($value.StartsWith("'") -and $value.EndsWith("'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $values[$key] = $value
    }

    return $values
}

function Write-CloudRunEnvFile {
    param(
        [hashtable]$DotEnvValues,
        [string]$OutputPath
    )

    $requiredKeys = @(
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_S3_REGION_NAME",
        "AWS_S3_BUCKET_NAME",
        "PINECONE_API_KEY",
        "PINECONE_INDEX_NAME",
        "POSTGRES_HOST",
        "POSTGRES_DATABASE",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD"
    )

    $optionalKeys = @(
        "NAVISENSE_BACKBONE_MODEL",
        "NAVISENSE_EMBEDDING_DIM",
        "NAVISENSE_CLIP_MODEL_NAME",
        "NAVISENSE_MODEL_NAME",
        "GEOLOCATION_MODEL_S3_KEY",
        "NAVISENSE_V3_S3_KEY",
        "ARCHITECTURAL_FEATURES_S3_KEY",
        "NAVISENSE_V3_SCORE_GATE",
        "NAVISENSE_V3_INFERENCE_TEMPERATURE",
        "NAVISENSE_V3_TEXT_FUSION_WEIGHT"
    )

    $lines = @()
    foreach ($key in $requiredKeys + $optionalKeys) {
        if (-not $DotEnvValues.ContainsKey($key)) {
            if ($requiredKeys -contains $key) {
                throw "Missing required key '$key' in .env"
            }
            continue
        }

        $escaped = $DotEnvValues[$key].Replace("'", "''")
        $lines += "${key}: '$escaped'"
    }

    $directory = Split-Path -Parent $OutputPath
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }

    Set-Content -Path $OutputPath -Value $lines
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $SourceDir) {
    $SourceDir = $scriptRoot
}
if (-not $ImageName) {
    $ImageName = "gcr.io/$ProjectId/$ServiceName"
}
if (-not $KeyFile) {
    $KeyFile = Join-Path (Split-Path -Parent $scriptRoot) ".codex-temp-cloudrun\gcloud-key.json"
}
if (-not $EnvPath) {
    $EnvPath = Join-Path (Split-Path -Parent $scriptRoot) ".codex-temp-cloudrun\cloudrun-env.yaml"
}

$gcloud = Find-GCloud
$env:CLOUDSDK_CORE_DISABLE_PROMPTS = "1"

Write-Step "Using gcloud at $gcloud"

$dotEnvPath = Join-Path $scriptRoot ".env"
if (-not $SkipEnvSync -and (Test-Path $dotEnvPath)) {
    Write-Step "Refreshing Cloud Run env file from $dotEnvPath"
    $dotEnvValues = Parse-DotEnv -Path $dotEnvPath
    Write-CloudRunEnvFile -DotEnvValues $dotEnvValues -OutputPath $EnvPath
} elseif (-not (Test-Path $EnvPath)) {
    if (-not (Test-Path $dotEnvPath)) {
        throw "Env file not found at $EnvPath and fallback .env does not exist at $dotEnvPath"
    }

    Write-Step "Generating Cloud Run env file from $dotEnvPath"
    $dotEnvValues = Parse-DotEnv -Path $dotEnvPath
    Write-CloudRunEnvFile -DotEnvValues $dotEnvValues -OutputPath $EnvPath
}

if (-not $SkipAuth) {
    if (Test-Path $KeyFile) {
        Write-Step "Activating service account"
        Invoke-GCloud -GCloudPath $gcloud -Arguments @(
            "auth", "activate-service-account",
            "--key-file=$KeyFile"
        )
    } else {
        Write-Step "Skipping service account activation because key file was not found"
    }
}

Write-Step "Setting active project to $ProjectId"
Invoke-GCloud -GCloudPath $gcloud -Arguments @(
    "config", "set", "project", $ProjectId
)

if (-not $SkipBuild) {
    Write-Step "Building image $ImageName from $SourceDir"
    Invoke-GCloud -GCloudPath $gcloud -Arguments @(
        "builds", "submit", $SourceDir,
        "--tag", $ImageName,
        "--project", $ProjectId
    )
}

if (-not $SkipDeploy) {
    Write-Step "Deploying $ServiceName to Cloud Run"
    Invoke-GCloud -GCloudPath $gcloud -Arguments @(
        "run", "deploy", $ServiceName,
        "--image", $ImageName,
        "--platform", "managed",
        "--region", $Region,
        "--memory", $Memory,
        "--cpu", $Cpu,
        "--timeout", "300",
        "--allow-unauthenticated",
        "--env-vars-file", $EnvPath,
        "--project", $ProjectId
    )

    Write-Step "Routing traffic to latest revision"
    Invoke-GCloud -GCloudPath $gcloud -Arguments @(
        "run", "services", "update-traffic", $ServiceName,
        "--to-latest",
        "--region", $Region,
        "--project", $ProjectId
    )
}

$serviceUrl = (& $gcloud "run" "services" "describe" $ServiceName "--region" $Region "--project" $ProjectId "--format=value(status.url)").Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to resolve service URL"
}

Write-Step "Service URL: $serviceUrl"

if (-not $SkipVerify) {
    Write-Step "Checking health"
    $health = Invoke-WebRequest -UseBasicParsing -Uri "$serviceUrl/health" -TimeoutSec 120
    $health.Content | Write-Host
}

if (-not $SkipRetrain) {
    Write-Step "Retraining deployed service"
    $retrain = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$serviceUrl/retrain" -TimeoutSec 1800
    $retrain.Content | Write-Host
}

Write-Step "Done"
