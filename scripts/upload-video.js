const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadVideo() {
  try {
    console.log('🎥 Starting video upload to Vercel Blob...');
    
    // Read the video file
    const videoPath = path.join(__dirname, '../public/BGVideo1.mp4');
    const videoBuffer = fs.readFileSync(videoPath);
    
    console.log(`📁 Video file size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Upload to Vercel Blob
    const blob = await put('BGVideo1.mp4', videoBuffer, {
      access: 'public',
      addRandomSuffix: false, // Keep original filename
    });
    
    console.log('✅ Video uploaded successfully!');
    console.log('🔗 Video URL:', blob.url);
    console.log('\n📝 Next steps:');
    console.log('1. Copy the URL above');
    console.log('2. Replace the video src in HomeSection.tsx');
    console.log('3. Update the video source from "/BGVideo1.mp4" to the blob URL');
    
    return blob.url;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadVideo();
