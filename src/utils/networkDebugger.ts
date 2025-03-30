
export const setupNetworkDebugger = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only debug Supabase requests
    if (url.includes('supabase')) {
      console.log(`🌐 Fetch request to: ${url}`);
      console.log('Request method:', init?.method || 'GET');
      
      if (init?.headers) {
        console.log('Request headers:', init.headers);
      }
      
      if (init?.body) {
        try {
          const bodyClone = init.body instanceof FormData 
            ? 'FormData (cannot display)' 
            : typeof init.body === 'string'
              ? JSON.parse(init.body)
              : init.body;
          
          console.log('Request body:', bodyClone);
        } catch (e) {
          console.log('Request body: [Could not parse]', init.body);
        }
      }
      
      try {
        const startTime = performance.now();
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        
        console.log(`🌐 Response from ${url} - Status: ${response.status} ${response.statusText} (${Math.round(endTime - startTime)}ms)`);
        
        // Clone the response to log its content without consuming it
        const clonedResponse = response.clone();
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const json = await clonedResponse.json();
            console.log('Response JSON:', json);
          } else {
            console.log('Response is not JSON. Content type:', contentType);
          }
        } catch (e) {
          console.log('Could not parse response:', e);
        }
        
        return response;
      } catch (error) {
        console.error(`🌐 Network error for ${url}:`, error);
        throw error;
      }
    }
    
    // For non-Supabase requests, use the original fetch
    return originalFetch(input, init);
  };
};
