import * as React from 'react';
import { MdArrowForwardIos } from "react-icons/md";

interface NewsCardProps {
  imageUrl?: string;
  date?: string;
  month?: string;
  title?: string;
  author?: string;
  link: string;
  isBlogLink?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  imageUrl, 
  date, 
  month, 
  title, 
  author, 
  link, 
  isBlogLink = false
}) => {
  // Special design for the last card (isBlogLink)
  if (isBlogLink) {
    return (
      <a
        href={link}
        className="group relative overflow-hidden transition-all duration-300 bg-[#181a1b] shadow-sm hover:shadow-2xl hover:scale-100 flex flex-col items-center justify-center min-h-[300px] border border-[#232323]"
      >
        <div className="flex flex-col items-center justify-center h-full w-full">
          <MdArrowForwardIos className="text-5xl text-white mb-2 group-hover:scale-150 transition-transform duration-300" />
          <span className="mt-8 text-[#f5f5f5] italic font-bold text-xl uppercase tracking-wider group-hover:text-4xl" style={{letterSpacing:'0.12em', fontFamily: "'Playfair Display', serif" }}>See All News</span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={link}
      className="block group relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-2xl"
    >
      {/* Image Background with Overlays */}
      <div
        className="relative h-80 bg-cover bg-center bg-no-repeat transition-transform duration-300 scale-95 group-hover:scale-100"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* Blur and darken on hover */}
        <div className="absolute inset-0 transition-all duration-300 z-10 group-hover:backdrop-blur-[2px] group-hover:bg-black/20 "></div>
        <div className="absolute bottom-0 left-0 z-20">
          {/* Date section */}
          <div className="bg-white text-gray-900 text-center w-20 py-3">
            <div className="text-xl font-bold leading-none">{date}</div>
            <div className="text-xs uppercase">{month}</div>
          </div>

          {/* Read More section */}
          {!isBlogLink && (
            <div className="bg-[#a8895c] text-white text-[10px] font-semibold uppercase transition-all duration-300 w-20 px-2 py-1 group-hover:py-3" style={{minHeight:'2.5rem', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span className="transition-all duration-300 text-left w-full group-hover:text-black group-hover:bg-[#a8895c]">Read More</span>
            </div>
          )}
        </div>
      </div>

      {/* Title and Author */}
      <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-1 uppercase transition-colors duration-300 group-hover:text-[#c0a16b]">{title}</h4>
        {author && (
          <h6
            className="max-w-3xl text-[#6e6c6c] italic"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {author}
          </h6>
        )}
      </div>
    </a>
  );
};

export default NewsCard;
