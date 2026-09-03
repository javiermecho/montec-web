import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuotationTool from './components/QuotationTool';
import Laboratory from './components/Laboratory';
import Accessories from './components/Accessories';
import LocationContact from './components/LocationContact';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import { DataProvider } from './context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF5500] selection:text-white">
        {/* Navbar flotante superior con acceso admin */}
        <Navbar />

        {/* Contenido Principal */}
        <main className="flex-1">
          <Hero />
          <QuotationTool />
          <Laboratory />
          <Accessories />
          <LocationContact />
        </main>

        {/* Footer */}
        <Footer />

        {/* Panel Administrador (Modal overlay cuando se activa) */}
        <AdminPanel />
      </div>
    </DataProvider>
  );
}
