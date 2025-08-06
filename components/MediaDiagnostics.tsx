'use client';

import { useEffect } from 'react';

export default function MediaDiagnostics() {
  useEffect(() => {
    console.log('🔍 MEDIA DIAGNOSTICS STARTING...');
    
    // Test critical media files
    const testFiles = [
      '/BGVideo1.mp4',
      '/full-width-images/section-bg-s.jpg',
      '/news1.jpg',
      '/news2.jpg',
      '/news3.jpg',
      '/logo-dark.png'
    ];
    
    testFiles.forEach(async (file) => {
      try {
        const response = await fetch(file, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ File accessible: ${file} (${response.status})`);
        } else {
          console.error(`❌ File not accessible: ${file} (${response.status})`);
        }
      } catch (error) {
        console.error(`❌ File fetch error: ${file}`, error);
      }
    });
    
    // Check public directory structure
    console.log('📁 Current location:', window.location.origin);
    console.log('📁 Public files should be at:', `${window.location.origin}/BGVideo1.mp4`);
    
    // Test if files exist by trying to load them
    const img = new Image();
    img.onload = () => console.log('✅ Test image loaded successfully');
    img.onerror = () => console.error('❌ Test image failed to load');
    img.src = '/logo-dark.png';
    
  }, []);
  
  return null; // This component only logs, doesn't render anything
}
