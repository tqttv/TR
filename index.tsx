import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CRITICAL: Root element not found in HTML");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to mount React application:", error);
    // Display error on screen so we don't just see white
    rootElement.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; background-color:#fef2f2; color:#991b1b; padding:20px;">
        <h1 style="font-size:24px; font-weight:bold; margin-bottom:10px;">عذراً، حدث خطأ في التشغيل</h1>
        <p style="margin-bottom:20px;">فشل تحميل التطبيق. يرجى التأكد من عملية الـ Build.</p>
        <pre style="background:white; padding:15px; border-radius:8px; border:1px solid #fca5a5; overflow:auto; max-width:800px; text-align:left; direction:ltr;">${String(error)}</pre>
      </div>
    `;
  }
}