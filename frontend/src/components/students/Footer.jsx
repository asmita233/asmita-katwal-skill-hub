import React, { useState } from 'react';
import { assets } from '../../assets/assets';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert('Thank you for subscribing!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-gray-900 w-full mt-10">
      <div className="md:px-36 px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-20 py-10 border-b border-white/20">
          {/* Logo & Description */}
          <div className="flex flex-col md:items-start items-center w-full md:w-1/3">
            <img src={assets.logo_dark} alt="logo" className="w-28" />
            <p className="mt-6 text-center md:text-left text-sm text-white/70 leading-relaxed">
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry's standard dummy text.
            </p>
          </div>

          {/* Company Links */}
          <div className="flex flex-col md:items-start items-center w-full md:w-1/4">
            <h2 className="font-semibold text-white mb-5">Company</h2>
            <ul className="flex flex-col items-center md:items-start text-sm text-white/70 space-y-3">
              <li>
                <a href="/" className="hover:text-white transition">Home</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">About us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Contact us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Privacy policy</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col md:items-start items-center w-full md:w-1/3">
            <h2 className="font-semibold text-white mb-5">Subscribe to our newsletter</h2>
            <p className="text-sm text-white/70 mb-4 text-center md:text-left">
              The latest news, articles, and resources, sent to your inbox weekly.
            </p>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-l bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 transition font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between text-sm text-white/50">
          <p>Copyright {new Date().getFullYear()} © Edemy. All Right Reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:opacity-80 transition">
              <img src={assets.facebook_icon} alt="facebook" className="w-5 h-5" />
            </a>
            <a href="#" className="hover:opacity-80 transition">
              <img src={assets.twitter_icon} alt="twitter" className="w-5 h-5" />
            </a>
            <a href="#" className="hover:opacity-80 transition">
              <img src={assets.instagram_icon} alt="instagram" className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
