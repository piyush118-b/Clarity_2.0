import * as React from 'react';
import '@fontsource/roboto/400.css';
import '@fortawesome/fontawesome-free/css/all.css';

const ContactSection: React.FC = () => {
  return (
    <section id="contacts" className="bg-[#1b1c1d] text-[#696e71] py-16 px-4 sm:px-6 lg:px-10" style={{ fontFamily: 'Roboto, Josefin Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        
        {/* Contact Info */}
        <div className="w-full md:w-1/2 space-y-10 text-center md:text-right flex flex-col items-center md:items-end">
          {/* CALL US */}
          <div className="flex flex-col md:flex-row items-center md:items-center gap-4">
            <i className="fas fa-phone-alt text-[#696e71] text-base md:text-lg order-1 md:order-3" />
            <div className="md:order-2 hidden md:block h-12 border-r border-[#696e71]" />
            <div className="order-2 md:order-1">
              <h4 className="text-base font-bold mb-1">CALL US</h4>
              <p className="text-2xl md:text-3xl">0333 772 3938</p>
            </div>
          </div>

          {/* ADDRESS */}
          <div className="flex flex-col md:flex-row items-center md:items-center gap-4">
            <i className="fas fa-map-marker-alt text-[#696e71] text-base md:text-lg order-1 md:order-3" />
            <div className="md:order-2 hidden md:block h-12 border-r border-[#696e71]" />
            <div className="order-2 md:order-1">
              <h4 className="text-base font-bold mb-1">ADDRESS</h4>
              <p className="text-sm leading-relaxed">
                Reality Housing & Support Ltd<br />
                71-75 Shelton Street, Covent Garden, London,<br />
                United Kingdom, WC2H 9JQ
              </p>
            </div>
          </div>

          {/* SAY HELLO */}
          <div className="flex flex-col md:flex-row items-center md:items-center gap-4">
            <i className="fas fa-envelope text-[#696e71] text-base md:text-lg order-1 md:order-3" />
            <div className="md:order-2 hidden md:block h-12 border-r border-[#696e71]" />
            <div className="order-2 md:order-1">
              <h4 className="text-base font-bold mb-1">SAY HELLO</h4>
              <p className="text-sm">hello@realityhs.co.uk</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="w-full md:w-1/2">
          <form className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full px-4 py-3 bg-[#1b1c1d] border-b-2 border-[#3a3a3a] text-[#696e71] placeholder-[#696e71] focus:outline-none focus:ring-2 focus:ring-[#696e71]"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-[#1b1c1d] border-b-2 border-[#3a3a3a] text-[#696e71] placeholder-[#696e71] focus:outline-none focus:ring-2 focus:ring-[#696e71]"
              />
            </div>
            <textarea
              rows={5}
              placeholder="Message"
              className="w-full max-w-lg mx-auto bg-[#181a1e] rounded-lg p-8 shadow-md border border-[#232427] text-[#cfd1d3] placeholder-[#696e71] resize-none focus:outline-none focus:ring-2 focus:ring-[#696e71]"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-[#1b1c1d] hover:bg-[#2f2f2f] text-[#696e71] font-semibold tracking-wide py-3 px-6 transition duration-300 border border-[#3a3a3a]"
            >
              SEND
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
