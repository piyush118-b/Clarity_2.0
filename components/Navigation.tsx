import * as React from 'react';
import { useState, useRef, useLayoutEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link } from 'react-scroll';
import '@fontsource/josefin-sans/400.css';
import '@fontsource/roboto/400.css';

interface MenuStyle {
  top: string;
  left: string;
  width: string;
}

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>({ top: '0', left: '0', width: '0' });
  const navRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (navRef.current) {
      const rect = navRef.current.getBoundingClientRect();
      setMenuStyle({
        top: `${rect.top + rect.height}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
      });
    }
  }, [isOpen]);

  return (
    <>
      {/* Navbar */}
      <div
        ref={navRef}
      style={{  fontFamily: 'Roboto, Josefin Sans, sans-serif' }}
        className="fixed opacity-80 top-3 left-3 bg-black bg-opacity-75 text-white flex items-center justify-between px-4 py-3 z-50  shadow-md max-w-fit"
        id="navbar"
      >
        {/* Logo */}
        <Link
          to="home"
          smooth={true}
          duration={500}
          className="flex items-center "
        >
          <img
            src="/logo-white1.png"
            alt="Reality HS"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Hamburger Toggler */}
        <button
          className="text-[#adb3b6] text-3xl ml-4 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
        {/* Divider Line */}
{isOpen && (
  <div
    style={{
      position: 'fixed',
      top: `${menuStyle.top}`,
      left: `${menuStyle.left}`,
      width: `${menuStyle.width}`,
      height: '1px',
      backgroundColor: '#555',
      zIndex: 45,
    }}
  />
)}

      {/* Slide-down Menu */}
      <div
        className={`fixed z-40 flex flex-col space-y-2  shadow-md overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 max-h-[300px] py-4' : 'opacity-0 max-h-0 py-0'}
        `}
        style={{
          ...menuStyle,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {['HOME', 'ABOUT', 'SERVICES', 'NEWS', 'CONTACTS'].map((item) => (
          <Link
            key={item}
            to={item.toLowerCase()}
            smooth={true}
            duration={500}
            spy={true}
            onClick={() => setIsOpen(false)}
            className="px-4 py-1   text-sm font-semibold text-[#adb3b6]
              hover:text-white hover:bg-[#4d4c4a94] hover:scale-105 transform transition duration-300 ease-in-out cursor-pointer"
          >
            {item}
          </Link>
        ))}
      </div>
    </>
  );
};

export default Navigation;
