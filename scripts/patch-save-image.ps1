$file = "app\api\location-recognition-v2\route.ts"
$content = Get-Content $file -Raw

$old = "      console.log('✅ Recognition saved successfully with ID:', recognition.id);
      return recognition.id;"

$new = @"
      console.log('✅ Recognition saved successfully with ID:', recognition.id);
      
      try {
        const base64Image = buffer.toString('base64');
        await prisma.trainingQueue.create({
          data: {
            imageUrl: 'recognition_' + recognition.id,
            address: result.address || 'Detected',
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            deviceId: userId || 'anon',
            status: 'READY',
            error: base64Image
          }
        });
        console.log('✅ Image saved to queue');
      } catch (err) {
        console.error('Queue save failed:', err);
      }
      
      return recognition.id;
"@

$content = $content -replace [regex]::Escape($old), $new
$content | Set-Content $file -Encoding UTF8 -NoNewline
Write-Host "Patched successfully"
