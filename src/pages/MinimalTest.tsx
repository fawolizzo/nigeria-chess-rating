
import React from 'react';

const MinimalTest = () => {
  console.log("MinimalTest component rendering");
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Nigerian Chess Rating System</h1>
      <p style={{ marginBottom: '16px' }}>If you can see this page, the React application is now working correctly.</p>
      <div style={{ padding: '16px', background: '#f0f0f0', borderRadius: '4px' }}>
        This is a test page to verify that rendering is working. The system will be fully restored once this basic functionality is confirmed.
      </div>
    </div>
  );
};

export default MinimalTest;
