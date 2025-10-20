export const environment = {
  production: true,
  apiBaseUrl: 'https://ingage-ai-agent-api-c6f9htcfd3baa2b4.canadacentral-01.azurewebsites.net',
  
  // Azure AD / MSAL Configuration for Client-Side Authentication
  msalConfig: {
    auth: {
      clientId: '3503e363-86d6-4b02-807d-489886873632', // Replace with your Azure AD App Client ID
      authority: 'https://login.microsoftonline.com/4d4eca3f-b031-47f1-8932-59112bf47e6b', // Replace with your Tenant ID
      // redirectUri: 'http://localhost:4200/',
      // postLogoutRedirectUri: 'http://localhost:4200'
      redirectUri: 'https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/',
      postLogoutRedirectUri: 'https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/'

    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    },
    system: {
      allowRedirectInIframe: false // true only if you truly run inside an iframe
    }
  },
  
  // API Scopes required for authentication
  apiScopes: {
    graph: ['User.Read'], // For user authentication
    // Fabric API scopes - Item.Execute.All is required for AI Skills (MLModel)
    fabric: [
      'https://api.fabric.microsoft.com/Item.Execute.All',
      'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
      'https://api.fabric.microsoft.com/Item.ReadWrite.All'
    ]
  }
};
