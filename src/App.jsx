import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { StoreProvider } from './context/StoreContext';
import CartSidebar from './components/CartSidebar';
import MobileNavSidebar from './components/MobileNavSidebar';
import ProductQuickView from './components/ProductQuickView';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <Router>
          <AnnouncementBar />
          <Header />
          <CartSidebar />
          <MobileNavSidebar />
          <ProductQuickView />
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
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
          <Footer />
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
