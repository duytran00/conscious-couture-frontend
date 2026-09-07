import React, { useState, useEffect } from 'react';
import ClothingAPI from '../utils/api';
import './SwapImpact.css';

const SwapImpact = ({ 
  clothingId1, 
  clothingId2, 
  transportDistance = null, 
  transportMethod = 'car' 
}) => {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    breakdown: false,
    recommendations: false,
    calculation: false
  });

  useEffect(() => {
    if (clothingId1 && clothingId2) {
      loadSwapImpactAnalysis();
    }
  }, [clothingId1, clothingId2, transportDistance, transportMethod]);

  const loadSwapImpactAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClothingAPI.getSwapImpactAnalysis(
        clothingId1, 
        clothingId2, 
        transportDistance, 
        transportMethod
      );
      setImpactData(data);
    } catch (err) {
      setError(err.message || 'Unable to load swap impact analysis');
      console.error('Failed to load swap impact analysis:', err);
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

  const getScoreColor = (score) => {
    if (score >= 9.0) return 'score-outstanding';
    if (score >= 7.0) return 'score-excellent';
    if (score >= 5.0) return 'score-good';
    if (score >= 3.0) return 'score-fair';
    return 'score-poor';
  };

  if (loading) {
    return (
      <div className="swap-impact-loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring primary"></div>
            <div className="spinner-ring secondary"></div>
          </div>
          <span className="loading-text">Analyzing swap impact...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-section">
        <div className="error-container">
          <div className="error-icon-wrapper">
            <div className="error-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="error-content">
            <h3 className="error-title">Swap Analysis Unavailable</h3>
            <p className="error-text">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!impactData) {
    return null;
  }

  const { 
    item1_summary, 
    item2_summary, 
    item1_impact, 
    item2_impact, 
    impact_comparison, 
    transport_impact, 
    swap_score, 
    equivalents, 
    recommendations 
  } = impactData;

  return (
    <div className="swap-impact">
      {/* Header */}
      <div className="swap-header">
        <div className="header-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div className="header-content">
          <h3 className="header-title">Swap Impact Analysis</h3>
          <p className="header-subtitle">Environmental comparison of clothing exchange</p>
        </div>
        <div className={`score-display ${getScoreColor(swap_score.score)}`}>
          <div className="score-number">
            {formatNumber(swap_score.score, 1)}
          </div>
          <div className="score-label">out of 10</div>
        </div>
      </div>

      {/* Item Comparison Cards */}
      <div className="item-comparison-grid">
        {/* Item 1 */}
        <div className="item-card">
          <div className="item-header">
            <h4 className="item-title">You Give</h4>
            <div className="item-badge give-badge">📤</div>
          </div>
          <div className="item-content">
            <h5 className="item-name">{item1_summary.name}</h5>
            <div className="item-details">
              <span className="item-detail">{item1_summary.type}</span>
              <span className="item-detail">{item1_summary.brand}</span>
              <span className="item-detail">{item1_summary.condition}</span>
            </div>
            <div className="environmental-cost">
              <div className="cost-label">Environmental Cost</div>
              <div className="cost-value">{formatNumber(item1_impact.environmental_cost.co2_kg)} kg CO₂</div>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="swap-arrow">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        {/* Item 2 */}
        <div className="item-card">
          <div className="item-header">
            <h4 className="item-title">You Get</h4>
            <div className="item-badge get-badge">📥</div>
          </div>
          <div className="item-content">
            <h5 className="item-name">{item2_summary.name}</h5>
            <div className="item-details">
              <span className="item-detail">{item2_summary.type}</span>
              <span className="item-detail">{item2_summary.brand}</span>
              <span className="item-detail">{item2_summary.condition}</span>
            </div>
            <div className="environmental-cost">
              <div className="cost-label">Environmental Cost</div>
              <div className="cost-value">{formatNumber(item2_impact.environmental_cost.co2_kg)} kg CO₂</div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Section */}
      <div className="score-section">
        <div className="score-main">
          <div className="score-circle">
            <div className={`score-text ${getScoreColor(swap_score.score)}`}>
              {formatNumber(swap_score.score, 1)}
            </div>
            <div className="score-max">/10</div>
          </div>
          <div className="score-description">
            <h4 className="score-grade">{swap_score.grade_description}</h4>
            <p className="score-detail">
              {swap_score.environmental_benefit ? 
                '🌱 This swap provides environmental benefit' : 
                '⚠️ This swap has environmental costs'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Impact Comparison */}
      <div className="impact-comparison">
        <h4 className="comparison-title">Environmental Impact Comparison</h4>
        <div className="comparison-content">
          <div className="comparison-item">
            <div className="comparison-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.4 4.4 0 003 15z" />
              </svg>
            </div>
            <div className="comparison-details">
              <div className="comparison-label">Net CO₂ Change</div>
              <div className={`comparison-value ${impact_comparison.net_environmental_change_co2 <= 0 ? 'value-positive' : 'value-negative'}`}>
                {impact_comparison.net_environmental_change_co2 <= 0 ? 
                  `${Math.abs(impact_comparison.net_environmental_change_co2).toFixed(1)} kg saved` :
                  `${impact_comparison.net_environmental_change_co2.toFixed(1)} kg added`
                }
              </div>
            </div>
          </div>
          <div className="comparison-description">
            {impact_comparison.impact_description}
          </div>
        </div>
      </div>

      {/* Transport Impact */}
      {transport_impact && (
        <div className="transport-impact">
          <h4 className="transport-title">Transportation Impact</h4>
          <div className="transport-content">
            <div className="transport-details">
              <span className="transport-detail">Distance: {transport_impact.distance_km} km</span>
              <span className="transport-detail">Method: {transport_impact.transport_method}</span>
              <span className="transport-detail">CO₂: {formatNumber(transport_impact.co2_emissions)} kg</span>
            </div>
            <div className="transport-penalty">
              Score penalty: -{formatNumber(transport_impact.penalty_applied, 1)} points
            </div>
          </div>
        </div>
      )}

      {/* Real-World Equivalents */}
      {(equivalents.km_not_driven > 0 || equivalents.trees_planted > 0) && (
        <div className="equivalents-section">
          <h4 className="equivalents-title">
            <div className="title-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            Environmental Impact Equivalents
          </h4>
          <div className="equivalents-grid">
            {equivalents.km_not_driven > 0 && (
              <div className="equivalent-item equivalent-driving">
                <div className="equivalent-value value-driving">{formatNumber(equivalents.km_not_driven, 0)}</div>
                <div className="equivalent-label">km not driven</div>
                <div className="equivalent-emoji">🚗</div>
              </div>
            )}
            {equivalents.trees_planted > 0 && (
              <div className="equivalent-item equivalent-trees">
                <div className="equivalent-value value-trees">{formatNumber(equivalents.trees_planted, 1)}</div>
                <div className="equivalent-label">trees planted</div>
                <div className="equivalent-emoji">🌳</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      <div className="expandable-sections">
        {/* Score Breakdown */}
        <div className="expandable-section">
          <button onClick={() => toggleSection('breakdown')} className="section-button">
            <span>Score Breakdown</span>
            <svg className={`section-icon ${expandedSections.breakdown ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.breakdown && (
            <div className="section-content">
              <div className="score-breakdown-grid">
                <div className="breakdown-item">
                  <span className="breakdown-label">Base Score:</span>
                  <span className="breakdown-value">{formatNumber(swap_score.breakdown.base_score, 1)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Transport Penalty:</span>
                  <span className="breakdown-value">{formatNumber(swap_score.breakdown.transport_penalty, 1)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Condition Bonus:</span>
                  <span className="breakdown-value">+{formatNumber(swap_score.breakdown.condition_bonus, 2)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Brand Sustainability:</span>
                  <span className="breakdown-value">+{formatNumber(swap_score.breakdown.brand_bonus, 2)}</span>
                </div>
                <div className="breakdown-item breakdown-total">
                  <span className="breakdown-label">Final Score:</span>
                  <span className="breakdown-value">{formatNumber(swap_score.breakdown.final_score, 1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="expandable-section">
            <button onClick={() => toggleSection('recommendations')} className="section-button">
              <span>Recommendations</span>
              <svg className={`section-icon ${expandedSections.recommendations ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.recommendations && (
              <div className="section-content">
                <ul className="recommendations-list">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="recommendation-item">
                      <span className="recommendation-icon">💡</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Calculation Details */}
        <div className="expandable-section">
          <button onClick={() => toggleSection('calculation')} className="section-button">
            <span>Calculation Details</span>
            <svg className={`section-icon ${expandedSections.calculation ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.calculation && (
            <div className="section-content">
              <div className="calculation-details">
                <div className="calc-item">
                  <span className="calc-label">Calculation version:</span>
                  <span className="calc-value">{impactData.calculation_metadata.version}</span>
                </div>
                <div className="calc-item">
                  <span className="calc-label">Data quality:</span>
                  <span className="calc-value">{impactData.calculation_metadata.data_quality}</span>
                </div>
                <div className="calc-item">
                  <span className="calc-label">Methodology:</span>
                  <span className="calc-value">{impactData.calculation_metadata.methodology}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapImpact;