import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import Navbar from './components/Navbar';
import AlbumList from './pages/AlbumList';
import Unauthorized from './pages/Unauthorized';

function AppRoutes() {
  const { config } = useConfig();

  if (!config) return <Unauthorized />;

  return (
    <>
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<AlbumList />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AppRoutes />
      </ConfigProvider>
    </BrowserRouter>
  );
}
