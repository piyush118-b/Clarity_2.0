import * as React from 'react';
import { useEffect, useRef } from 'react';
import ServicesCard from './ServicesCard';
import '../styles/mobile-services.css';

interface ServiceItem {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  delay: string;
}

const ServicesSection: React.FC = () => {
  const serviceItemsRef = useRef<NodeListOf<Element> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!serviceItemsRef.current) return;
      
      serviceItemsRef.current.forEach((item) => {
        const top = item.getBoundingClientRect().top;
        const winHeight = window.innerHeight;
        if (top < winHeight * 0.85) {
          item.classList.add('opacity-100', 'translate-y-0');
          item.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    };

    // Initialize the ref after the component mounts
    serviceItemsRef.current = document.querySelectorAll('.service-item');
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);



  const services: ServiceItem[] = [
    {
      title: 'SAFE HOUSING',
      content: 'All of our rooms are fully compliant and our team of support staff conduct regular checks and risk assessments to ensure the safety of our tenants. Know someone struggling with homelessness? Access free advice with Crisis',
      buttonText: 'Crisis',
      buttonLink: 'https://www.crisis.org.uk/',
      delay: '0ms',
    },
    {
      title: 'MONEY MANAGEMENT',
      content: 'We have access to money management courses and general tips to help kurb bad spending habits. Struggling with gambling? Try the free tools from GambleAware®',
      buttonText: 'GambleAware',
      buttonLink: 'https://www.gambleaware.org/',
      delay: '100ms',
    },
    {
      title: 'MENTAL HEALTH',
      content: 'Support staff visit tenants regularly to ensure they are meeting their weekly goals and can assist with making appointments with local GPs. Need someone to talk to urgently? Text SHOUT to 85258 for mental health support 247.',
      buttonText: 'Shout',
      buttonLink: 'https://giveusashout.org/',
      delay: '200ms',
    },
    {
      title: 'HYGIENE',
      content: 'All of our tenants can access a range of free hygiene products. Did you know 4.2 million adults in the UK are living in hygiene poverty and cannot afford to stay clean? The Hygiene Bank is working on tackling this.  is working on tackling this.',
      buttonText: 'The Hygiene Bank',
      buttonLink: 'https://thehygienebank.com/',
      delay: '300ms',
    },
    {
      title: 'TRAINING COURSES',
      content: 'Support staff can recommend and help tenants apply for training courses. Check out Workers\' Educational Association for more information on courses for adults',
      buttonText: 'WEA',
      buttonLink: 'https://www.wea.org.uk/',
      delay: '400ms',
    },
    {
      title: 'CAN YOU HELP US?',
      content: 'We\'re always looking for volunteers and organisations to help us collaborate on helpful projects for the communities our tenants live in. If you think you\'ve got something interesting to offer our tenants, please contact us!',
      buttonText: 'Contact Us',
      buttonLink: '#contacts',
      delay: '500ms',
    },
  ];

  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [isSticky, setIsSticky] = React.useState(false);
  const [hasScrolledPast, setHasScrolledPast] = React.useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionTopRef = useRef<number>(0);

  // Sticky scroll functionality (mobile only)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Check if we're on mobile (screen width < 768px)
    const isMobile = () => window.innerWidth < 768;
    const stickyOffset = 20; // Offset in pixels from the top of the viewport

    const handleScroll = () => {
      if (!isMobile()) return; // Only apply sticky scroll on mobile
      
      const rect = section.getBoundingClientRect();
      // Add stickyOffset to the condition to start sticky behavior lower
      if (rect.top <= stickyOffset && !isSticky && !hasScrolledPast) {
        setIsSticky(true);
        // Adjust the scroll position to account for the offset
        sectionTopRef.current = window.scrollY + (rect.top - stickyOffset);
      }
      if (isSticky) {
        window.scrollTo(0, sectionTopRef.current);
      }
    };

    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      if (!isMobile() || !isSticky) return; // Only apply on mobile when sticky
      
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 500) return; // Debounce wheel event
      lastWheelTime = now;

      setActiveTab(prev => {
        const nextTab = prev + (e.deltaY > 0 ? 1 : -1);
        if (nextTab >= services.length) {
          setIsSticky(false);
          setHasScrolledPast(true);
          return services.length - 1;
        }
        if (nextTab < 0) {
          return 0;
        }
        return nextTab;
      });
    };

    // Reset sticky state on window resize
    const handleResize = () => {
      if (!isMobile() && isSticky) {
        setIsSticky(false);
        setHasScrolledPast(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSticky, hasScrolledPast, services.length]);

  // Handle tab clicks and scroll active card into view
  useEffect(() => {
    if (cardContainerRef.current) {
      const cardElement = cardContainerRef.current.children[activeTab] as HTMLElement;
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab]);

  const handleTabClick = (index: number) => {
    if (isSticky) return; // Disable tab clicking while sticky
    setActiveTab(index);
  };

  // Scroll tab into view on mobile
  useEffect(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.children[activeTab] as HTMLElement;
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  return (
    <section ref={sectionRef} id="services" className="w-full min-h-[65vh]">
      <div className="flex flex-col lg:flex-row w-full">
        {/* Left Side - Image with Text Overlay */}
        <div className="relative lg:w-2/5 w-full flex items-center justify-center text-white px-6 py-28 overflow-hidden bg-gray-800">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-left scale-105"
            style={{
              backgroundImage: "url('/section-bg-s.jpg')",
              backgroundRepeat: 'no-repeat',
              zIndex: 0,
            }}
          ></div>

          {/* Content */}
          <div className="relative z-10 p-8 rounded-lg max-w-lg text-center">
            <h2 className="text-4xl text-white font-bold mb-4">SUPPORT SERVICES</h2>
            <p
              className="mt-6 max-w-3xl text-white text-lg md:text-xl font-medium italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              We are continually working on expanding our network of support services
              to really make a difference to those we house.
            </p>
          </div>
        </div>

        {/* Right Side - Cards */}
        <div className="lg:w-3/5 w-full bg-white flex flex-col">
          {/* Mobile: Enhanced Tab Bar with Scrollable Cards - Only show on mobile */}
          <div className={`mobile-tabs-container block md:hidden w-full ${isSticky ? 'is-sticky' : ''}`}>
            {/* Horizontal Scrollable Tabs */}
            <div className="relative">
              <div
                ref={tabsRef}
                className="flex overflow-x-auto scrollbar-hide px-4 py-3 space-x-1 bg-gray-50 border-b border-gray-200"
              >
                {services.map((service, idx) => (
                  <button
                    key={service.title}
                    className={`service-tab-button relative flex-shrink-0 px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                      activeTab === idx
                        ? 'text-white shadow-md bg-black'
                        : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleTabClick(idx)}
                  >
                    {service.title}
                    {activeTab === idx && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#c0a16b] rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Progress Indicator */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                <div
                  className="h-full transition-all duration-300 ease-out progress-bar"
                  style={{ width: `${((activeTab + 1) / services.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Mobile Card Container with Horizontal Scroll */}
            <div
              ref={cardContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: isSticky ? 'auto' : 'smooth' }}
            >
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="mobile-service-card w-full flex-shrink-0 snap-center"
                >
                  <div className="p-6 h-full flex flex-col justify-center">
                    <div className="mobile-service-card-shadow bg-white rounded-lg p-6 h-full flex flex-col justify-between">
                      <div className="service-content-fade">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed text-center mb-6">
                          {service.content}
                        </p>
                      </div>
                      <div className="text-center">
                        <a
                          href={service.buttonLink}
                          className="service-button inline-block px-6 py-3 text-sm font-semibold text-white bg-black rounded-full transition-all duration-300 hover:bg-gray-800 hover:scale-105"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {service.buttonText}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center space-x-2 py-4 bg-gray-50">
              {services.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeTab === idx ? 'bg-[#c0a16b] scale-125 nav-dot-active' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => handleTabClick(idx)}
                ></button>
              ))}
            </div>
          </div>

          {/* Desktop: Original Grid Layout - Only show on desktop */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full h-full">
            {services.map((service, index) => (
              <div
                key={index}
                className="service-item opacity-0 translate-y-10 transition-all duration-500 ease-out"
                style={{
                  transitionDelay: service.delay,
                } as React.CSSProperties}
              >
                <ServicesCard
                  title={service.title}
                  content={service.content}
                  buttonText={service.buttonText}
                  buttonLink={service.buttonLink}
                  animationDelay={service.delay}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
