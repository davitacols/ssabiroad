$content = Get-Content 'app\api\location-recognition-v2\route.ts' -Raw

# Fix corrupted console.log statements
$content = $content -replace "console\.log\('.*?' Navisense ML did NOT provide valid location - continuing with other methods'\);", "console.log('❌ Navisense ML did NOT provide valid location - continuing with other methods');"
$content = $content -replace "console\.log\('.*?' Any location found from this point forward should NOT be labeled as navisense-ml'\);", "console.log('⚠️ Any location found from this point forward should NOT be labeled as navisense-ml');"
$content = $content -replace "console\.log\('.*?' Step 2: Trying Claude AI analysis\.\.\.'\);", "console.log('🔍 Step 2: Trying Claude AI analysis...');"
$content = $content -replace "console\.log\('.*?' Navisense prediction timed out or failed:', error\.message\);", "console.log('⚠️ Navisense prediction timed out or failed:', error.message);"

# Save the fixed content
$content | Set-Content 'app\api\location-recognition-v2\route.ts' -Encoding UTF8