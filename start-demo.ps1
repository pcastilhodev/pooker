# start-demo.ps1 -- Inicia o Pooker completo para demonstracao
# Execute: .\start-demo.ps1

$root = $PSScriptRoot

# Garante que o Python do runner esta no PATH desta sessao
$runnerPython = "C:\actions-runner\_work\_tool\Python\3.11.9\x64"
if (Test-Path "$runnerPython\python.exe") {
    $env:PATH = "$runnerPython;$runnerPython\Scripts;" + $env:PATH
}

function Write-Step($msg) { Write-Host "" ; Write-Host $msg -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  >>  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "       POOKER -- Demo Local           " -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta

# -- 1. POSTGRESQL ------------------------------------------------------------
Write-Step "1/5  PostgreSQL (Docker)"

docker compose -f "$root\docker-compose.local.yml" up -d
Write-OK "PostgreSQL iniciado"

Write-Warn "Aguardando banco ficar pronto (15s)..."
Start-Sleep -Seconds 15
Write-OK "Banco pronto"

# -- 2. PYTHON SERVICES -------------------------------------------------------
Write-Step "2/5  Servicos Python (FastAPI)"

$pythonServices = @(
    @{ name = "filmes-service";   dir = "backend\filmes-service";   port = 8000 },
    @{ name = "alugueis-service"; dir = "backend\alugueis-service"; port = 8001 },
    @{ name = "user-service";     dir = "backend\user-service";     port = 8002 },
    @{ name = "payment-service";  dir = "backend\payment-service";  port = 8005 }
)

# Detecta Python disponivel para servicos
$pyExe = $null
foreach ($candidate in @("C:\actions-runner\_work\_tool\Python\3.11.9\x64\python.exe", "py", "python3", "C:\Python311\python.exe", "C:\Python3\python.exe")) {
    try {
        $ver = & $candidate --version 2>&1
        if ($ver -match "Python") { $pyExe = $candidate; break }
    } catch {}
}
if (-not $pyExe) { $pyExe = "python" }
Write-OK "Usando Python: $pyExe"

foreach ($svc in $pythonServices) {
    $svcDir = "$root\$($svc.dir)"
    $cmd = "Set-Location '$svcDir'; & '$pyExe' -m pip install -r requirements.txt -q; & '$pyExe' -m uvicorn app.main:app --host 0.0.0.0 --port $($svc.port)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Minimized
    Write-OK "$($svc.name)  ->  http://localhost:$($svc.port)"
}

# -- 3. JAVA SERVICES ---------------------------------------------------------
Write-Step "3/5  Servicos Java (Spring Boot)"
Write-Warn "Primeira execucao pode levar 2-3 minutos (Gradle/Maven download)"

$authDir = "$root\backend\auth-service"
$gwDir   = "$root\backend\api-gateway"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$authDir'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Write-OK "auth-service    ->  http://localhost:8081"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$gwDir'; .\gradlew.bat bootRun" -WindowStyle Minimized
Write-OK "api-gateway     ->  http://localhost:8080"

# -- 4. SEED ------------------------------------------------------------------
Write-Step "4/5  Populando banco com dados de demo"
Write-Warn "Aguardando servicos Python iniciarem (25s)..."
Start-Sleep -Seconds 25

# Detecta Python disponivel
$pyCmd = $null
foreach ($candidate in @("C:\actions-runner\_work\_tool\Python\3.11.9\x64\python.exe", "py", "python3", "C:\Python311\python.exe", "C:\Python3\python.exe")) {
    try {
        $ver = & $candidate --version 2>&1
        if ($ver -match "Python") { $pyCmd = $candidate; break }
    } catch {}
}

if (-not $pyCmd) {
    Write-Host "  AVISO: Python nao encontrado. Rode manualmente depois:" -ForegroundColor Red
    Write-Host "    python database\seed.py" -ForegroundColor Yellow
} else {
    Write-OK "Python encontrado: $pyCmd"
    & $pyCmd -m pip install psycopg2-binary passlib bcrypt -q
    & $pyCmd "$root\database\seed.py"
}

# -- 5. ANGULAR ---------------------------------------------------------------
Write-Step "5/5  Frontend Angular"
$frontDir = "$root\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontDir'; npm start" -WindowStyle Normal
Write-OK "Frontend Angular  ->  http://localhost:4200"

# -- RESUMO -------------------------------------------------------------------
Write-Host ""
Write-Host "===================================================" -ForegroundColor Magenta
Write-Host "  TUDO INICIADO -- aguarde ~2 min para Java subir  " -ForegroundColor Magenta
Write-Host "===================================================" -ForegroundColor Magenta
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
