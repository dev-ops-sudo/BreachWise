$body = @{
    scenarioName = "Phishing Campaign"
    scenarioDescription = "A targeted phishing campaign targeting executive emails with malicious attachments"
    attackType = "phishing"  
    numberOfQuestions = 5
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3002/api/warroom/generate-questions" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "=== PHISHING SCENARIO TEST ==="
Write-Host "Status: $($response.StatusCode)"
$json = $response.Content | ConvertFrom-Json
Write-Host "Questions returned: $($json.questions.Count)"
Write-Host ""
Write-Host "Question Details:"
$json.questions | ForEach-Object {
    Write-Host "  - $($_.question_text)"
    Write-Host "    Difficulty: $($_.difficulty) | Topic: $($_.topic)"
    Write-Host "    Correct Answer: $($_.correct_answer)"
    Write-Host ""
}
