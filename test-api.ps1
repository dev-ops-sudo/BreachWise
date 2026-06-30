$body = @{
    scenarioName = "Ransomware Attack"
    scenarioDescription = "A ransomware strain has been detected actively encrypting files"
    attackType = "ransomware"  
    numberOfQuestions = 3
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3002/api/warroom/generate-questions" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "Status: $($response.StatusCode)"
Write-Host "=== Response ==="
$response.Content
