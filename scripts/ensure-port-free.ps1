$port = 5000
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
foreach ($connection in $connections) {
    if ($connection.OwningProcess -and $connection.OwningProcess -ne 0) {
        try {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}
