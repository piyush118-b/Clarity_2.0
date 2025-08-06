import * as React from 'react';
import { motion, Variants } from 'framer-motion';

const mapVariants: Variants = {
  hidden: { opacity: 0, y: -40, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { type: 'spring', stiffness: 70, damping: 15 } },
  exit: { opacity: 0, y: -30, height: 0, transition: { duration: 0.3 } }
};

const MapSection: React.FC = () => (
  <motion.div
    className="w-full flex justify-center items-center bg-white border-t border-gray-300 z-40 overflow-hidden"
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={mapVariants}
  >
    <iframe
      title="Google Map"
      width="100%"
      height="600"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      src="https://www.google.com/maps/embed/v1/place?q=place_id:ChIJV-YBZ0C4cEgRNogOrkF73Lw&key=AIzaSyDc0C6pG4HHDfT9cIqRQfqv1mMbBcVdcFM"
    ></iframe>
  </motion.div>
);

export default MapSection;
