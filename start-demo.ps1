# start-demo.ps1 — Inicia o Pooker completo para demonstracao
# Execute como: .\start-demo.ps1

$root = $PSScriptRoot
$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║        POOKER — Demo Local           ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Magenta

# ── 1. POSTGRESQL ────────────────────────────────────────────────────────────
Write-Step "1/5  PostgreSQL (Docker)"

$pgRunning = docker ps --filter "name=pooker-postgres" --filter "status=running" -q 2>$null
if ($pgRunning) {
    Write-OK "PostgreSQL ja esta rodando"
} else {
    docker compose -f "$root\docker-compose.local.yml" up -d
    Write-OK "PostgreSQL iniciado"

    Write-Warn "Aguardando banco ficar pronto..."
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2
        $check = docker exec (docker ps -q --filter "ancestor=postgres:15") `
                     pg_isready -U postgres -d trabalho_if 2>$null
        if ($check -match "accepting connections") { $ready = $true; break }
    }
    if (-not $ready) {
        Write-Host "ERRO: PostgreSQL nao respondeu a tempo." -ForegroundColor Red
        exit 1
    }
    Write-OK "Banco pronto"
}

# ── 2. PYTHON SERVICES ───────────────────────────────────────────────────────
Write-Step "2/5  Servicos Python (FastAPI)"

$pythonServices = @(
    @{ name = "filmes-service";   dir = "backend\filmes-service";   port = 8000 },
    @{ name = "alugueis-service"; dir = "backend\alugueis-service"; port = 8001 },
    @{ name = "user-service";     dir = "backend\user-service";     port = 8002 },
    @{ name = "payment-service";  dir = "backend\payment-service";  port = 8005 }
)

foreach ($svc in $pythonServices) {
    $svcDir = "$root\$($svc.dir)"
    $cmd = "Set-Location '$svcDir'; pip install -r requirements.txt -q; python -m uvicorn app.main:app --host 0.0.0.0 --port $($svc.port)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Minimized
    Write-OK "$($svc.name)  →  http://localhost:$($svc.port)"
}

# ── 3. JAVA SERVICES ─────────────────────────────────────────────────────────
Write-Step "3/5  Servicos Java (Spring Boot)"
Write-Warn "Primeira execucao pode levar 2-3 minutos (Gradle/Maven download)"

$authDir = "$root\backend\auth-service"
$gwDir   = "$root\backend\api-gateway"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$authDir'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Write-OK "auth-service    →  http://localhost:8081"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$gwDir'; .\gradlew.bat bootRun" -WindowStyle Minimized
Write-OK "api-gateway     →  http://localhost:8080"

# ── 4. SEED ──────────────────────────────────────────────────────────────────
Write-Step "4/5  Populando banco com dados de demo"
Write-Warn "Aguardando servicos Python iniciarem (20s)..."
Start-Sleep -Seconds 20

pip install psycopg2-binary passlib bcrypt -q
python "$root\database\seed.py"

# ── 5. ANGULAR ───────────────────────────────────────────────────────────────
Write-Step "5/5  Frontend Angular"
$frontDir = "$root\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontDir'; npm start" -WindowStyle Normal
Write-OK "Frontend Angular  →  http://localhost:4200"

# ── RESUMO ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  TUDO INICIADO — aguarde ~2 min para Java subir  " -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Frontend      http://localhost:4200" -ForegroundColor White
Write-Host "  API Gateway   http://localhost:8080" -ForegroundColor White
Write-Host "  Auth Service  http://localhost:8081" -ForegroundColor White
Write-Host "  Filmes API    http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Alugueis API  http://localhost:8001/docs" -ForegroundColor White
Write-Host "  User API      http://localhost:8002/docs" -ForegroundColor White
Write-Host "  Payment API   http://localhost:8005/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Credenciais:" -ForegroundColor Yellow
Write-Host "    admin@pooker.com  /  admin123  (ADMIN)" -ForegroundColor Yellow
Write-Host "    joao@pooker.com   /  user123   (USER)" -ForegroundColor Yellow
Write-Host "    maria@pooker.com  /  user123   (USER)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Para expor via ngrok:" -ForegroundColor Green
Write-Host "    ngrok http 4200" -ForegroundColor Green
Write-Host ""
