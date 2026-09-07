import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClothingAPI, { SwapAPI } from '../utils/api';
import SwapImpact from '../components/SwapImpact';
import { useAuth } from '../context/AuthContext';

const SwapDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const swapData = location.state;
  const [message, setMessage] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [transportDistance, setTransportDistance] = useState(null);
  const [transportMethod, setTransportMethod] = useState('car');
  const [myOwnerName, setMyOwnerName] = useState(null);
  const [theirOwnerName, setTheirOwnerName] = useState(null);

  // Fetch actual owner names
  useEffect(() => {
    if (!swapData) return;
    const { targetItem, selectedItem } = swapData;

    // Current user's name
    if (user?.name) {
      setMyOwnerName(user.name);
    } else {
      setMyOwnerName('You');
    }

    // Target item's owner name
    if (targetItem?.id) {
      ClothingAPI.getOwnerInfo(targetItem.id)
        .then(info => setTheirOwnerName(info.display_name))
        .catch(() => setTheirOwnerName('Item Owner'));
    }
  }, [swapData, user]);

  if (!swapData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Swap Not Found</h2>
          <p className="text-gray-600 mb-4">The swap details could not be loaded.</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Go Home</button>
        </div>
      </div>
    );
  }

  const { targetItem, selectedItem } = swapData;

  // Formatted owner labels
  const myLabel = myOwnerName ? `${myOwnerName}'s Item` : 'Your Item';
  const theirLabel = theirOwnerName ? `${theirOwnerName}'s Item` : 'Their Item';

  const handleSendMessage = () => {
    if (!message.trim()) return;
    console.log('Sending message:', message);
    setMessage('');
  };

  const handleConfirmSwap = async () => {
    try {
      setIsConfirming(true);
      setError(null);

      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Use the real SwapAPI to create the swap
      try {
        const swap = await SwapAPI.createSwap(
          selectedItem.id,
          targetItem.id,
          message || 'I would like to swap items with you!'
        );
        console.log('Swap created via API:', swap);
        alert('Swap request sent! You will be notified when the other user responds.');
        navigate('/');
      } catch (apiErr) {
        // If the API call fails, show the error
        setError(apiErr.message || 'Failed to send swap request. Please try again.');
        console.error('Swap API error:', apiErr);
      }

    } catch (err) {
      setError('Failed to send swap request. Please try again.');
      console.error('Failed to create swap:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900">← Back</button>
              <h1 className="text-2xl font-bold text-gray-900">Swap Details</h1>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* ── Swap header with ACTUAL NAMES ── */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-8">
              <span className="text-lg font-medium text-gray-900">{myLabel}</span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">↔</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
              </div>
              <span className="text-lg font-medium text-gray-900">{theirLabel}</span>
            </div>
          </div>

          {/* Items Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Your Item */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{myLabel}</h3>
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={selectedItem.image || "/api/placeholder/150/200"}
                    alt={selectedItem.name}
                    className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-md border border-gray-100 shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{selectedItem.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Size: {selectedItem.size}</p>
                  <p className="text-sm text-gray-600">Condition: {selectedItem.condition}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{selectedItem.description}</p>
                  {selectedItem.brand && (
                    <p className="text-xs text-gray-500 mt-1">Brand: {selectedItem.brand}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Their Item — with actual owner name */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{theirLabel}</h3>
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={targetItem.images ? targetItem.images[0] : targetItem.image || "/api/placeholder/150/200"}
                    alt={targetItem.name}
                    className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-md border border-gray-100 shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{targetItem.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Size: {targetItem.size}</p>
                  <p className="text-sm text-gray-600">Condition: {targetItem.condition}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{targetItem.description}</p>
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      Owner: {theirOwnerName || 'Loading...'}
                    </span>
                    {targetItem.brand && (
                      <span className="block text-xs text-gray-500">Brand: {targetItem.brand}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Impact Analysis */}
        <div className="mb-6">
          <SwapImpact
            clothingId1={selectedItem.id}
            clothingId2={targetItem.id}
            transportDistance={transportDistance}
            transportMethod={transportMethod}
          />
        </div>

        {/* Swap Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Swap Status
          </h3>
          <div className="flex items-center p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex-shrink-0 mr-4"></div>
            <div>
              <h4 className="font-semibold text-blue-900">Pending Request</h4>
              <p className="text-sm text-blue-800">
                Waiting for <span className="font-medium">{theirOwnerName || 'the owner'}</span> to respond. They have 7 days.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 px-2">
            Your request will be sent shortly. You'll be notified when they reply.
          </p>
        </div>

        {/* Communication */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Send a Message
          </h3>
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Introduce yourself to ${theirOwnerName || 'the owner'} or ask any questions...`}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none shadow-inner"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Swap Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Swap Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">Meeting Options</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Meet locally in a safe public place</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Ship items with tracking</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Use Conscious Couture delivery</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">Safety & Protection</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> All swaps protected by our guarantee</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Report issues within 24 hours</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Community ratings ensure trust</li>
              </ul>
            </div>
          </div>

          {/* Transport Options */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">Transport Details</h4>
            <p className="text-sm text-gray-500 mb-5">Optional — affects environmental score</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1.5">Distance (km)</label>
                <input id="distance" type="number" min="0" step="0.1"
                  value={transportDistance || ''}
                  onChange={(e) => setTransportDistance(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 5.2"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
                <select id="method" value={transportMethod} onChange={(e) => setTransportMethod(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm cursor-pointer">
                  <option value="walking">🚶 Walking (0 emissions)</option>
                  <option value="bike">🚲 Cycling (0 emissions)</option>
                  <option value="public_transport">🚌 Public Transport</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="train">🚆 Train</option>
                  <option value="car">🚗 Car</option>
                  <option value="motorcycle">🏍️ Motorcycle</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pb-12">
          <button onClick={() => navigate(-1)}
            className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all">
            Edit Request
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all">
              Cancel
            </button>
            <button onClick={handleConfirmSwap} disabled={isConfirming}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-md transform hover:-translate-y-0.5 transition-all disabled:bg-gray-300 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center">
              {isConfirming && (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>)}
              {isConfirming ? 'Sending...' : 'Confirm Swap Request'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SwapDetails;