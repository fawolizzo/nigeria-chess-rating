
import React from 'react';

const MinimalTest = () => {
  console.log("MinimalTest component rendering");
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>If you can see this, the application is rendering correctly.</p>
    </div>
  );
};

export default MinimalTest;
