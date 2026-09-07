import React, { useState, useEffect } from 'react';
import ClothingAPI from '../utils/api';
import './SustainabilityMetrics.css';

const SustainabilityMetrics = ({ clothingId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    breakdown: false,
    brand: false,
    calculation: false
  });

  useEffect(() => {
    if (clothingId) {
      loadSustainabilityMetrics();
    }
  }, [clothingId]);

  const loadSustainabilityMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClothingAPI.getSustainabilityMetrics(clothingId);
      setMetrics(data);
    } catch (err) {
      setError('Unable to load sustainability metrics');
      console.error('Failed to load sustainability metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  };

  const getTransparencyBadge = (score) => {
    if (!score) return { text: 'Unknown', color: 'bg-gray-100 text-gray-600' };
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <div className="sustainability-loading">
        <div className="flex items-center justify-center">
          <div className="loading-spinner mr-3">
            <div className="spinner-ring primary"></div>
            <div className="spinner-ring secondary"></div>
          </div>
          <span className="text-emerald-700 font-medium">Loading sustainability metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-300 rounded p-4 flex items-center">
        <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
          !
        </div>
        <div>
          <h3 className="font-bold text-orange-900">Data Unavailable</h3>
          <p className="text-orange-800 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const { new_garment, reuse_impact, avoided_impact, equivalents, brand_context } = metrics;

  return (
    <div className="sustainability-metrics">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center flex-1">
          <div className="header-icon">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-900">Sustainability Impact</h3>
            <p className="text-gray-600 text-sm">Choosing reuse over new production</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-center md:text-right">
          <div className="percentage-number">{formatNumber(avoided_impact.percentage_reduction, 0)}%</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">impact reduction</div>
        </div>
      </div>

      {/* Main Impact Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* CO2 Saved */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700 text-sm">CO₂ Avoided</span>
            <div className="card-icon icon-co2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.4 4.4 0 003 15z" /></svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatNumber(avoided_impact.co2_kg)} kg</div>
          <div className="text-xs text-gray-500 mt-1">vs. buying new</div>
        </div>

        {/* Water Saved */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700 text-sm">Water Saved</span>
            <div className="card-icon icon-water">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-600">{formatNumber(avoided_impact.water_liters, 0)} L</div>
          <div className="text-xs text-gray-500 mt-1">liters of water</div>
        </div>

        {/* Energy Saved */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700 text-sm">Energy Saved</span>
            <div className="card-icon icon-energy">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-500">{formatNumber(avoided_impact.energy_kwh)} kWh</div>
          <div className="text-xs text-gray-500 mt-1">kilowatt hours</div>
        </div>
      </div>

      {/* Real-World Equivalents */}
      <div className="bg-white border border-gray-200 rounded p-5 mb-8 shadow-sm">
        <h4 className="flex items-center text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
          <div className="title-icon mr-2">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
          </div>
          Real-World Equivalents
        </h4>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{formatNumber(equivalents.km_not_driven, 0)}</div>
            <div className="text-xs text-gray-600 font-medium">km not driven</div>
            <div className="mt-1">🚗</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded p-3 text-center">
            <div className="text-xl font-bold text-emerald-600">{formatNumber(equivalents.trees_planted, 1)}</div>
            <div className="text-xs text-gray-600 font-medium">trees planted</div>
            <div className="mt-1">🌳</div>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded p-3 text-center">
            <div className="text-xl font-bold text-cyan-600">{formatNumber(equivalents.days_drinking_water, 0)}</div>
            <div className="text-xs text-gray-600 font-medium">days drinking water</div>
            <div className="mt-1">💧</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded p-3 text-center">
            <div className="text-xl font-bold text-amber-600">{equivalents.smartphone_charges}</div>
            <div className="text-xs text-gray-600 font-medium">phone charges</div>
            <div className="mt-1">📱</div>
          </div>
        </div>
      </div>

      {/* Expandable Data Tables */}
      <div className="border border-gray-300 rounded bg-white overflow-hidden mb-8">
        
        {/* Impact Breakdown */}
        <div>
          <button
            onClick={() => toggleSection('breakdown')}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center border-b border-gray-200 focus:outline-none"
          >
            <span className="font-bold text-gray-800">Impact Breakdown Details</span>
            <svg className={`w-4 h-4 section-icon ${expandedSections.breakdown ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {expandedSections.breakdown && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200">
              <div>
                <h5 className="font-bold text-gray-900 mb-3 uppercase tracking-wide text-xs">New Item Production</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Material production:</span> <span className="font-medium text-gray-900">{formatNumber(new_garment.breakdown.material_production)} kg CO₂</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Manufacturing:</span> <span className="font-medium text-gray-900">{formatNumber(new_garment.breakdown.manufacturing)} kg CO₂</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Dyeing:</span> <span className="font-medium text-gray-900">{formatNumber(new_garment.breakdown.dyeing)} kg CO₂</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Transport:</span> <span className="font-medium text-gray-900">{formatNumber(new_garment.breakdown.transport)} kg CO₂</span></div>
                  <div className="flex justify-between font-bold pt-1"><span className="text-gray-900">Total:</span> <span className="text-gray-900">{formatNumber(new_garment.co2_kg)} kg CO₂</span></div>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-gray-900 mb-3 uppercase tracking-wide text-xs">Reuse Platform Overhead</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Collection:</span> <span className="font-medium text-gray-900">{formatNumber(reuse_impact.breakdown.collection)} kg CO₂</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Sorting:</span> <span className="font-medium text-gray-900">{formatNumber(reuse_impact.breakdown.sorting)} kg CO₂</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Transport:</span> <span className="font-medium text-gray-900">{formatNumber(reuse_impact.breakdown.transport)} kg CO₂</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-600">Platform overhead:</span> <span className="font-medium text-gray-900">{formatNumber(reuse_impact.breakdown.platform_overhead)} kg CO₂</span></div>
                  <div className="flex justify-between font-bold pt-1"><span className="text-gray-900">Total:</span> <span className="text-gray-900">{formatNumber(reuse_impact.co2_kg)} kg CO₂</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Brand Sustainability */}
        {brand_context.brand_name && (
          <div>
            <button
              onClick={() => toggleSection('brand')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center border-b border-gray-200 focus:outline-none"
            >
              <span className="font-bold text-gray-800">Brand Sustainability Profile</span>
              <svg className={`w-4 h-4 section-icon ${expandedSections.brand ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {expandedSections.brand && (
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-bold text-lg text-gray-900">{brand_context.brand_name}</h5>
                  {brand_context.transparency_score && (
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getTransparencyBadge(brand_context.transparency_score).color}`}>
                      {getTransparencyBadge(brand_context.transparency_score).text} ({brand_context.transparency_score}/100)
                    </span>
                  )}
                </div>
                {brand_context.impact_commitments && Object.keys(brand_context.impact_commitments).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-100">
                    {Object.entries(brand_context.impact_commitments).map(([key, value]) => (
                      value !== null && (
                        <div key={key} className="flex items-center text-sm">
                          <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                          <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Calculation Details */}
        <div>
          <button
            onClick={() => toggleSection('calculation')}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center focus:outline-none"
          >
            <span className="font-bold text-gray-800">Calculation Metadata</span>
            <svg className={`w-4 h-4 section-icon ${expandedSections.calculation ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {expandedSections.calculation && (
            <div className="p-4 bg-white text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between border-b border-gray-100 py-1"><span>Version:</span> <span className="font-medium text-gray-900">{metrics.calculation_metadata.version}</span></div>
                <div className="flex justify-between border-b border-gray-100 py-1"><span>Data quality:</span> <span className="capitalize font-medium text-gray-900">{metrics.calculation_metadata.data_quality}</span></div>
              </div>
              <div>
                <div className="flex justify-between border-b border-gray-100 py-1"><span>Assumed wears:</span> <span className="font-medium text-gray-900">{metrics.calculation_metadata.assumptions.wears}</span></div>
                <div className="flex justify-between border-b border-gray-100 py-1"><span>Assumed washes:</span> <span className="font-medium text-gray-900">{metrics.calculation_metadata.assumptions.washes}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="cta-section text-center p-6 mt-4 shadow-sm">
        <div className="cta-emoji">🌱</div>
        <h4 className="text-xl font-bold text-emerald-900 mb-2">Great choice for the planet!</h4>
        <p className="text-emerald-800 text-sm mb-4 max-w-lg mx-auto">
          Choosing this pre-owned item makes a tangible difference. Every sustainable choice counts toward a healthier planet.
        </p>
      </div>
      
    </div>
  );
};

export default SustainabilityMetrics;