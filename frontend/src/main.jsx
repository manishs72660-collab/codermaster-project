import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
import { store } from "./store/store.js"
import { Provider } from 'react-redux';
import logo from './assets/mylogo.png'
document.head.insertAdjacentHTML(
  'beforeend',
  `<link rel="icon" type="image/png" href="${logo}" />`
);
document.title = "CodeMaster";
createRoot(document.getElementById('root')).render(
    <Provider store={store}>
    <BrowserRouter>
    <App />
    </BrowserRouter>
    </Provider>
)