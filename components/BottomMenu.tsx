import * as React from 'react';
import { Link } from 'react-scroll';
import { IoLocationSharp } from 'react-icons/io5';
import { FaArrowAltCircleUp } from 'react-icons/fa';

interface BottomMenuProps {
  onMapClick: () => void;
}

const BottomMenu: React.FC<BottomMenuProps> = ({ onMapClick }) => {
  return (
    <div className="bottom-0 left-0 w-full bg-[#181a1efb] flex justify-center items-center border-gray-800 z-50">
      <button
        type="button"
        className="flex items-center text-gray-400 hover:text-white px-6 py-4 transition-all duration-300 focus:outline-none"
        id="see-map"
        onClick={onMapClick}
      >
        <span className="mr-2 text-3xl">
          <IoLocationSharp />
        </span>
        <span>See Map</span>
      </button>

      {/* Scroll Up */}
      <Link
        to="home"
        smooth={true}
        duration={900}
        spy={true}
        className="flex items-center text-gray-400 hover:text-white px-6 py-4 transition-all duration-300 cursor-pointer"
      >
        <span className="mr-2 text-3xl">
          <FaArrowAltCircleUp />
        </span>
        <span>Scroll Up</span>
      </Link>
    </div>
  );
};

export default BottomMenu;
