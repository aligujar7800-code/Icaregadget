import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MobilesPage from './pages/MobilesPage';
import AudioPage from './pages/AudioPage';
import AccessoriesPage from './pages/AccessoriesPage';
import SmartHomePage from './pages/SmartHomePage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import TrackOrderPage from './pages/TrackOrderPage';
import ReturnsPage from './pages/ReturnsPage';
import WarrantyPage from './pages/WarrantyPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import { StoreProvider } from './context/StoreContext';
import CartSidebar from './components/CartSidebar';
import MobileNavSidebar from './components/MobileNavSidebar';
import ProductQuickView from './components/ProductQuickView';
import CustomerChatWidget from './components/CustomerChatWidget';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <AnnouncementBar />}
      {!isAdmin && <Header />}
      {!isAdmin && <CartSidebar />}
      {!isAdmin && <MobileNavSidebar />}
      <ProductQuickView />
      <CustomerChatWidget />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mobiles" element={<MobilesPage />} />
        <Route path="/audio" element={<AudioPage />} />
        <Route path="/accessories" element={<AccessoriesPage />} />
        <Route path="/smart-home" element={<SmartHomePage />} />
        <Route path="/book-appointment" element={<BookAppointmentPage />} />
        <Route path="/track" element={<TrackOrderPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/warranty" element={<WarrantyPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<CustomerDashboard />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <Router>
          <AppContent />
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
