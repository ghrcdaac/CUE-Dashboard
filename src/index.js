import React from 'react';
import ReactDOM from 'react-dom/client'; // Correct import for React 18+
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux'; // Import Provider
import store from './app/store';       // Import your store

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <Provider store={store}> {/* Wrap App with Provider */}
      <App />
    </Provider>
 // {/* </React.StrictMode> */}
);

reportWebVitals();




// index.js
// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { AuthProvider } from "react-oidc-context";

// const cognitoAuthConfig = {
//   authority: "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_P9iA4SzlA",
//   client_id: "79gtmmmfqupli6li25aar2p4u9",
//   redirect_uri: "http://localhost:3000",
//   response_type: "code",
//   scope: "aws.cognito.signin.user.admin email openid phone",
// };

// const root = ReactDOM.createRoot(document.getElementById("root"));

// // wrap the application with AuthProvider
// root.render(
//   <React.StrictMode>
//     <AuthProvider {...cognitoAuthConfig}>
//       <App />
//     </AuthProvider>
//   </React.StrictMode>
// );