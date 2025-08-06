import * as React from 'react';

const AboutSection: React.FC = () => {
  return (
    <section id="about" className="min-h-[60vh] flex flex-col justify-center items-center bg-[#f8f8f6] px-4 py-12 text-center">
      <h3 className="text-2xl md:text-5xl tracking-wide text-black font-poppins font-bold">
        REALITY HOUSING & SUPPORT
        <span className="text-[#c0a16b] text-sm">.</span>
      </h3>

      <p className="mt-6 max-w-3xl text-[#6e6c6c] text-lg md:text-xl font-medium italic font-playfair">
        Primarily focusing on housing and supporting vulnerable adults, known for our focus on ethics and
        commitment to providing quality housing.
      </p>

      <div className="mt-6 w-16 border-b-1 border-[#c0a16b]"></div>
    </section>
  );
};

export default AboutSection;
