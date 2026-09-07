import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/login'
import Signup from './pages/signup'
import ItemDetails from './pages/ItemDetails'
import EditItem from './pages/EditItem'
import SwapDetails from './pages/SwapDetails'
import Checkout from './pages/Checkout'
import UploadItem from './pages/UploadItem'
import Sustain from './pages/Sustain'
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Settings"
import Edit from './pages/Edit'
import Leaderboard from "./pages/Leaderboard"
import SellerOnboarding from "./pages/SellerOnboarding"

function App() {
  return (
    <Router>
      {/* CartProvider must be outside AuthProvider because AuthProvider calls useCart */}
      <CartProvider>
        <AuthProvider>
          <div className="min-h-screen w-full">
            <Header />
            <main className="w-full min-h-screen" style={{ paddingTop: '90px' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/item/:id" element={<ItemDetails />} />
                <Route path="/item/:id/edit" element={<EditItem />} />
                <Route path="/swap/:swapId" element={<SwapDetails />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/upload" element={<UploadItem />} />
                <Route path="/sustain" element={<Sustain />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/edit" element={<Edit />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/seller-onboarding" element={<SellerOnboarding />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </CartProvider>
    </Router>
  );
}

export default App