import * as React from 'react';
import { motion } from 'framer-motion';
import '@fontsource/josefin-sans/400.css';
import '@fontsource/roboto/400.css';

interface ServicesCardProps {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  animationDelay?: string;
}

const ServicesCard: React.FC<ServicesCardProps> = ({ 
  title, 
  content, 
  buttonText, 
  buttonLink,
  animationDelay = '0'
}) => {
  return (
    <motion.div
      className="relative w-full h-full p-9 bg-white text-gray-500 text-base font-light text-center border border-gray-200 flex items-center justify-center group overflow-hidden service-item transition-all duration-500 ease-out"
      style={{ 
        borderWidth: '0.25px', 
        fontFamily: 'Roboto, Josefin Sans, sans-serif'
      }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        transition: { duration: 0.3 }
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        ease: 'easeOut',
        delay: parseFloat(animationDelay) / 1000
      }}
    >
      {/* Title */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 text-sm font-semibold text-gray-800 transition-opacity duration-500 ease-in-out z-10 group-hover:opacity-0 opacity-100"
      >
        {title}
      </div>

      {/* Content + Button (hidden by default, shown on hover) */}
      <div
        className="flex flex-col justify-between items-center h-full transition-opacity duration-500 ease-in-out z-20 opacity-0  group-hover:opacity-100"
      >
        <p className="leading-relaxed text-sm font-light mb-2 ">{content}</p>
        <a
          href={buttonLink}
          className="inline-block mt-4 px-6 py-2 text-sm font-semibold text-white bg-black rounded-full transition-all duration-300 hover:bg-opacity-90"
          target="_blank"
          rel="noopener noreferrer"
        >
          {buttonText}
        </a>
      </div>
    </motion.div>
  );
}

export default ServicesCard;
