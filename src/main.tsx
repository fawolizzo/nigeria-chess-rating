
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure that the container element exists before rendering
const container = document.getElementById("root");

if (!container) {
  throw new Error("Failed to find the root element. Make sure there is a div with id 'root' in your HTML.");
}

const root = createRoot(container);
root.render(<App />);
