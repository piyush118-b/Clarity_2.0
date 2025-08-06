import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-scroll';
import { motion, AnimatePresence } from 'framer-motion';
import { SlMouse } from "react-icons/sl";
import { animatedWords } from '@/data/animatedWords';
import VideoBackground from './VideoBackground';

const HomeSection: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % animatedWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="home"
      className="relative w-screen h-screen overflow-hidden"
    >
      {/* Background Video */}
      <VideoBackground 
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />
      



      {/* Overlay Content with reduced opacity for better video visibility */}
      <div className="relative z-10 flex items-center justify-center h-full bg-black/30">
        <div className="relative z-10 text-center px-4 w-full max-w-6xl">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-1 md:mb-4 uppercase leading-none">
  <div className="mb-2">MAKING A</div>
  <div className="mb-1.5">DIFFERENCE TO</div>
  <div className="h-16 md:h-24 relative" style={{ color: '#c3a876' }}>
    <AnimatePresence mode="wait">
      <motion.span
        key={animatedWords[currentWordIndex]}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center text-5xl md:text-7xl"
      >
        {animatedWords[currentWordIndex]}
      </motion.span>
    </AnimatePresence>
  </div>
</h2>



          <Link
  to="about"
  smooth={true}
  duration={500}
  className="mt-4 inline-block bg-[#f6f5f3] hover:bg-gray-200 text-black font-bold px-6 py-2 md:px-8 md:py-3 shadow-lg transition-all duration-300 hover:scale-105"
>
  REALITY HOUSING & SUPPORT
</Link>
        </div>
      </div>

      {/* Scroll Down Indicator - Perfectly centered */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
        <Link
          to="about"
          smooth={true}
          duration={500}
          className="text-white animate-bounce flex flex-col items-center justify-center cursor-pointer hover:text-[#c3a876] transition-colors duration-300"
        >
          <SlMouse className='text-4xl text-[#cfd1d3] mb-2 hover:text-[#c3a876] transition-colors duration-300'/>
          <span className="text-sm text-[#cfd1d3] uppercase tracking-wider font-light hover:text-[#c3a876] transition-colors duration-300">Scroll Down</span>
        </Link>
      </div>
    </section>
  );
}

export default HomeSection;
