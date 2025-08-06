import * as React from 'react';
import '@fontsource/roboto/400.css';

const FooterSection: React.FC = () => {
  return (
    <footer style={{ fontFamily: 'Roboto, Josefin Sans, sans-serif' }} className="bg-[#181a1e] h-[202px] flex items-center justify-center text-center px-4">
      <div className="text-sm space-y-1 leading-relaxed">
        <p className="text-[#aaaaaa]">
          <span className="font-semibold">© REALITY HOUSING & SUPPORT LTD </span>
          <span className="text-xs align-baseline">2025</span>
        </p>
        <p className="text-[#696e71]">
          REGISTERED IN <span className="italic text-[18px] text-[#aaaaaa] text-base">England</span> AND <span className="italic text-[#aaaaaa] text-[18px] text-base">Wales</span>.
        </p>
        <p className="text-[#696e71]">COMPANY NUMBER: 16225571</p>
      </div>
    </footer>
  );
};

export default FooterSection;
