import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-6 mt-auto">
      <div className="container max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Nigerian Chess Rating System. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
