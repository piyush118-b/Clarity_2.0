import * as React from 'react';
import '@fontsource/poppins/700.css';
import '@fontsource/playfair-display/400-italic.css';
import NewsList from './NewsList';

const NewsSection: React.FC = () => {
  return (
    <section>
      <div id="news" className="min-h-[40vh] flex flex-col justify-center items-center bg-white px-4 py-12 text-center">
        <h3
          className="text-2xl md:text-5xl tracking-wide text-black font-light"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
        >
          LATEST NEWS
          <span className="text-[#c0a16b] text-sm">.</span>
        </h3>

        <p
          className="mt-6 max-w-3xl text-[#6e6c6c] text-lg md:text-xl font-medium italic"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          We regularly share up to date news regarding housing and homelessness
        </p>

        <div className="mt-6 w-16 border-b-1 border-[#c0a16b]"></div>
      </div>
      <NewsList />
    </section>
  );
};

export default NewsSection;
