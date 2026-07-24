  import { Outlet } from "react-router-dom";
  import Navbar from "./Navbar";
import Footer from "./Footer";

// default layout for navbar
  const Layout = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* render childrens for each role nav items  (matched child route)*/}
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  };

  export default Layout;
