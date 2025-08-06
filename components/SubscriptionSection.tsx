import * as React from 'react';

const SubscriptionSection: React.FC = () => {
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log('Subscribed with email:', email);
  };
  return (
    <section className="h-auto sm:h-[202px] bg-[#f6f5f3] flex items-center justify-center px-4 sm:px-8 py-10 sm:py-0">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl gap-6 sm:gap-4 text-center sm:text-left"
      >
        {/* Left: Text + Input */}
        <div className="w-full sm:w-2/3 flex flex-col items-center sm:items-start">
          <label htmlFor="email" className="text-sm text-gray-400 font-semibold mb-1">
            GET OUR NEWSLETTER
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ENTER YOUR EMAIL"
            className="w-full border-b border-gray-300 text-black text-2xl font-bold bg-transparent focus:outline-none placeholder-black py-4 text-center sm:text-left"
            required
          />
        </div>

        {/* Right: Button */}
        <div className="w-full sm:w-auto flex justify-center sm:justify-end">
          <button 
            type="submit"
            className="bg-[#2c2c2c] text-white font-semibold tracking-widest px-10 py-5 w-full sm:w-auto hover:bg-black transition-colors duration-300"
          >
            SUBSCRIBE
          </button>
        </div>

      </form>
    </section>
  );
};

export default SubscriptionSection;
