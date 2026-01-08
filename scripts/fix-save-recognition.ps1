$file = "app\api\location-recognition-v2\route.ts"
$content = Get-Content $file -Raw

# Find and replace the saveRecognition method
$pattern = "(?s)(private async saveRecognition.*?recognition\.id\);)\s+(return recognition\.id;)"

$replacement = '$1
      
      try {
        const base64Image = buffer.toString(''base64'');
        await prisma.trainingQueue.create({
          data: {
            imageUrl: ''recognition_'' + recognition.id,
            address: result.address || ''Detected'',
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            deviceId: userId || ''anon'',
            status: ''READY'',
            error: base64Image
          }
        });
      } catch (err) {
        console.error(''Queue save failed:'', err);
      }
      
      $2'

$content = $content -replace $pattern, $replacement
$content | Set-Content $file -Encoding UTF8 -NoNewline
Write-Host "Fixed saveRecognition method"
