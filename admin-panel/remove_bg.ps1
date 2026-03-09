Add-Type -AssemblyName System.Drawing
$path = "d:\Research\AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line\admin-panel\src\img\post.png"
$outPath = "d:\Research\AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line\admin-panel\src\img\post_transparent.png"
if(Test-Path $path) {
    try {
        $img = [System.Drawing.Bitmap]::FromFile($path)
        $bgColor = $img.GetPixel(0, 0)
        $img.MakeTransparent($bgColor)
        $img.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "SUCCESS: Saved to $outPath"
    } catch {
        Write-Error $_.Exception.Message
    }
} else {
    Write-Error "File not found: $path"
}
