import { Outlet } from 'react-router-dom';
import Header from './Header';


const Layout = () => {
  return (
    <div className="w-full min-h-screen bg-muted dark:bg-gray-900">
      <Header />
      <main className="w-full px-20 py-8">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout; 