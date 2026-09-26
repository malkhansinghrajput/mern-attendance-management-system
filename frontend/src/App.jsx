import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' },
          success: { style: { background: '#10b981', color: '#fff' } },
          error: { style: { background: '#ef4444', color: '#fff' } },
        }}
      />
      <AppRouter />
    </>
  );
};

export default App;
