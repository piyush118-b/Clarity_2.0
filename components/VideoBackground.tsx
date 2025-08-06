import * as React from 'react';

interface VideoBackgroundProps {
  className?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  className = "absolute top-0 left-0 w-full h-full object-cover z-0"
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Video source - prioritize local file
  const videoSources = [
    // Primary: Local file (works in development and production with proper deployment)
    '/BGVideo1.mp4'
  ];

  React.useEffect(() => {
    console.log('🎥 VideoBackground: Component mounted');
    console.log('🎥 VideoBackground: Video sources:', videoSources);
  }, []);

  const handleLoadStart = () => {
    console.log('🎥 Video: Load started');
    if (videoRef.current) {
      console.log('🎥 Video: Current src:', videoRef.current.currentSrc);
      console.log('🎥 Video: Network state:', videoRef.current.networkState);
    }
  };

  const handleLoadedData = () => {
    console.log('🎥 Video: Data loaded');
    setIsLoaded(true);
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log('🎥 Video: Can play - making visible and starting playback');
    const video = e.currentTarget;
    video.style.opacity = '1';
    video.play().catch(err => {
      console.error('🎥 Video: Play failed:', err);
    });
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const error = e.currentTarget.error;
    if (error) {
      console.error('🎥 Video: Error occurred:', {
        code: error.code,
        message: error.message
      });
    } else {
      console.warn('🎥 Video: Error occurred but no error details available');
    }
    setHasError(true);
  };

  // If video fails to load, show nothing (let parent handle background)
  if (hasError) {
    console.log('🎥 VideoBackground: Video failed to load');
    return null;
  }

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      poster="/images/hero-poster.jpg"
      className={`${className} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoadStart={handleLoadStart}
      onLoadedData={handleLoadedData}
      onCanPlay={handleCanPlay}
      onError={handleError}
      style={{
        opacity: isLoaded ? 1 : 0
      }}
    >
      {videoSources.map((src, index) => (
        <source key={index} src={src} type="video/mp4" />
      ))}
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
