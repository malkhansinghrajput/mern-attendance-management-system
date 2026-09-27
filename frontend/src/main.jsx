import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { SocketProvider } from './context/SocketContext';
import App from './App';
import './styles/index.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* SocketProvider wraps the entire app so any component can call useSocket() */}
      <SocketProvider>
        <App />
      </SocketProvider>
    </Provider>
  </React.StrictMode>
);
