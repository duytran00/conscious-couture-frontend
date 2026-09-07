import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";
import SustainabilityMetrics from '../components/SustainabilityMetrics';

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import Co2Icon from '@mui/icons-material/Co2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RecyclingIcon from '@mui/icons-material/Recycling';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ClothingAPI from '../utils/api';
import { SwapAPI } from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [listingsFilter, setListingsFilter] = useState("active");
  const [ownersitems, setOwnersitems] = useState([]);
  const [errors, setErrors] = useState({});
  const [swapitems, setSwapItems] = useState([]);
  const [metrics, setMetrics] = useState({
    co2_kg: 0,
    water_liters: 0,
  });
  const [soldCount, setSoldCount] = useState(0);
  const [purchaseid, setPurchaseid] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [solditemsimpact, setSoldItemsWithImpact] = useState([]);

  // Seller dashboard state
  const [sellerAccount, setSellerAccount] = useState(null);
  const [sellerBalance, setSellerBalance] = useState(null);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [dashboardLinkLoading, setDashboardLinkLoading] = useState(false);

  


  // Set initial tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadSwaps = async () => {
      try {
        const data = await SwapAPI.getMySwaps();
        setSwapItems(data.items || data);
      } catch (err) {
        setErrors(err.message || "Failed to load swaps");
      }
    };
    loadSwaps();
  }, []);
  const currentUserId = Number(localStorage.getItem("user_id"));

  useEffect(() => {
    const load_purchased = async () => {
      try {
        // get purchased items
        const sale_response = await ClothingAPI.getSales({ per_page: 100 });
        // console.log('sale items:', sale_response);

        // extract IDs directly
        const sold_items = sale_response.items
          .filter(item => item.buyer_id === currentUserId)
          .map(item => ({
            id: item.clothing_id,
            seller_id: item.seller_id,
            date: item.created_at,
          }));
        const soldWithNames = await Promise.all(
          sold_items.map(async (item) => {
            const name_response = await ClothingAPI.getName(item.seller_id);
        
            return {
              ...item,
              seller_name: name_response.name
            };
          })
        );
        
        // console.log("soldWithNames:", soldWithNames);
        // setPurchaseid(sold_items); // still set state if you need it elsewhere

        // now use sold_items directly for filtering
        const response = await ClothingAPI.getClothingItems({ per_page: 100 });

        const purchase = response.items.filter(item =>
          sold_items.some(s => s.id === item.clothing_id)
        );

        const formattedPurchase = purchase.map(item => {
          const soldItem = soldWithNames.find(
            s => s.id === item.clothing_id
          );
        
          return {
            owner_id: item.owner_user_id,
            id: item.clothing_id,
            image: item.primary_image_url || '/placeholder-image.jpg',
            title: item.description || 'No description',
            price: item.sell_price || 0,
            status: item.status,
            views: 0,
            date: soldItem?.date,
            seller_name: soldItem?.seller_name
          };
        });

        setPurchasedItems(formattedPurchase);
        // console.log("formattedPurchase:", formattedPurchase);
      } catch (err) {
        console.error(err);
        // setError(err.message || 'Failed to load items');
      }
    };
    load_purchased();
  }, []);

  useEffect(() => {
    const loadClothingItems = async () => {
      try {
        const response = await ClothingAPI.getClothingItems({ per_page: 100 });        
        const sold = response.items.filter(item => item.owner_user_id === currentUserId && item.status === 'sold').length;
        setSoldCount(sold);
        // Transform API data to match frontend format 
        const itemsfromapi = response.items.filter((item => item.owner_user_id === currentUserId)).
        map(item => ({
          owner_id: item.owner_user_id,
          id: item.clothing_id,
          image: item.primary_image_url || '/placeholder-image.jpg',
          title: item.description || 'No description',
          price: item.sell_price || 0,
          status: item.status,
          views: 0, // change later
          date: item.created_at
        }));
        // console.log("owneritems", itemsfromapi)
        setOwnersitems(itemsfromapi);
      } catch (err) {
        setErrors(err.message);
        console.error('Failed to load clothing items:', err);
      } 
    };
    loadClothingItems();
  }, []);
  useEffect(() => {
    const loadAllMetrics = async () => {
      const soldItems = ownersitems.filter(item => item.status === "sold");
  
      const soldItemsWithImpact = await Promise.all(
        soldItems.map(async (item) => {
          const data = await ClothingAPI.getSustainabilityMetrics(item.id);
  
          return {
            ...item,
            impact: {
              co2: data.avoided_impact?.co2_kg || 0,
              water: data.avoided_impact?.water_liters || 0
            }
          };
        })
      );
  
      const totalCO2 = soldItemsWithImpact.reduce(
        (sum, item) => sum + item.impact.co2,
        0
      );
  
      const totalWater = soldItemsWithImpact.reduce(
        (sum, item) => sum + item.impact.water,
        0
      );
  
      setMetrics({
        co2_kg: totalCO2,
        water_liters: totalWater
      });
  
      setSoldItemsWithImpact(soldItemsWithImpact);
    };
    if (ownersitems.length > 0) {
      loadAllMetrics();
    }
  }, [ownersitems]);

  // Load seller data when seller tab is active
  useEffect(() => {
    if (activeTab !== 'seller') return;
    const loadSellerData = async () => {
      setSellerLoading(true);
      try {
        const [accountRes, balanceRes, ordersRes] = await Promise.all([
          ClothingAPI.getStripeAccountStatus().catch(() => null),
          ClothingAPI.getSellerBalance().catch(() => null),
          ClothingAPI.getSellerOrders().catch(() => ({ orders: [] })),
        ]);
        setSellerAccount(accountRes);
        setSellerBalance(balanceRes);
        setSellerOrders(ordersRes?.orders || []);
      } catch (err) {
        console.error('Failed to load seller data:', err);
      } finally {
        setSellerLoading(false);
      }
    };
    loadSellerData();
  }, [activeTab]);

  if (!metrics) return null;
  // Mock data - replace with API calls
  const stats = {
    totalListings: 12,
    activeListings: 8,
    soldItems: 4,
    totalEarnings: 245.00,
    totalPurchases: 3,
    completedSwaps: 2,
    co2Saved: 45.5,
    waterSaved: 2150
  };

  const myListings = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
      title: 'Vintage Denim Jacket',
      price: 45.00,
      status: 'active',
      views: 24,
      date: '2026-03-10'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
      title: 'Organic Cotton T-Shirt',
      price: 25.00,
      status: 'sold',
      views: 56,
      date: '2026-03-05'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200',
      title: 'Linen Summer Dress',
      price: 55.00,
      status: 'active',
      views: 18,
      date: '2026-03-12'
    }
  ];

  const purchaseHistory = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200',
      title: 'Vintage 90s Spiderman T-shirt',
      price: 45.00,
      seller: 'VintageFinds',
      date: '2026-02-20',
      status: 'delivered'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
      title: 'Wool Winter Coat',
      price: 85.00,
      seller: 'EcoWardrobe',
      date: '2026-02-15',
      status: 'shipped'
    }
  ];

  const swapHistory = [
    {
      id: 1,
      myItem: {
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200',
        title: 'Blue Flannel Shirt'
      },
      theirItem: {
        image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=200',
        title: 'Green Cardigan'
      },
      partner: 'SustainableStyle',
      date: '2026-02-28',
      status: 'completed'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DashboardIcon },
    { id: 'listings', label: 'My Listings', icon: InventoryIcon },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBagIcon },
    { id: 'swaps', label: 'Swaps', icon: SwapHorizIcon },
    { id: 'seller', label: 'Seller', icon: StorefrontIcon },
    { id: 'impact', label: 'Impact', icon: EnergySavingsLeafIcon }
  ];

  // const filteredListings = myListings.filter(item => {
  //   if (listingsFilter === 'all') return true;
  //   return item.status === listingsFilter;
  // });
  // console.log("ownersitems:", ownersitems);
  // console.log("listingsFilter:", listingsFilter);
  // ownersitems.forEach(item => console.log("status:", item.status));
  const filteredListings = ownersitems.filter(item => {
    if (listingsFilter === 'all') return true;
    if (listingsFilter === 'active') return item.status === 'available';
    return item.status === listingsFilter;
  });
  const getsoldItems = ownersitems.filter(item => 
    item.status?.toLowerCase() === "sold"
  );
  // delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
  
    try {
      await ClothingAPI.deleteClothingItem(id); // call your static method
  
      // Update UI: remove the deleted item locally
      setOwnersitems(prev => prev.filter(item => item.id !== id));
  
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: { bg: '#dcfce7', color: '#166534', label: 'Available' }, 
      active: { bg: '#dcfce7', color: '#166534', label: 'Active' },
      sold: { bg: '#dbeafe', color: '#1e40af', label: 'Sold' },
      delivered: { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
      shipped: { bg: '#fef3c7', color: '#92400e', label: 'Shipped' },
      pending: { bg: '#f3f4f6', color: '#6b7280', label: 'Pending' },
      completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span className="status-badge" style={{ background: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  if (!isAuthenticated) {
    return null;
  }
  console.log(solditemsimpact);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <h3 className="sidebar-name">{user?.name || 'User'}</h3>
              <p className="sidebar-email">{user?.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="sidebar-icon" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <Link to="/settings" className="sidebar-nav-item">
              <SettingsIcon className="sidebar-icon" />
              Settings
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="dashboard-content">
              <div className="content-header">
                <h1 className="content-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                <p className="content-subtitle">Here's what's happening with your sustainable wardrobe.</p>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-container" style={{ background: '#ecfdf5' }}>
                    <InventoryIcon style={{ color: '#10b981' }} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{ownersitems.filter(item => item.status === "available").length}</span>
                    <span className="stat-label">Active Listings</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-container" style={{ background: '#dbeafe' }}>
                    <ShoppingBagIcon style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="stat-info">
                    {/* <span className="stat-value">{filteredListings.filter(item => item.status === "sold").length}</span> */}
                    <span className="stat-value">{soldCount}</span>
                    
                    <span className="stat-label">Items Sold</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-container" style={{ background: '#fef3c7' }}>
                    <TrendingUpIcon style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                    {/* ${filteredListings.filter(item => item.status === "sold").reduce((sum, item) => sum + Number(item.price), 0)}                     */}
                    ${ownersitems
                    .filter(item => item.status?.trim().toLowerCase() === "sold")
                    .reduce((sum, item) => sum + Number(item.price || 0), 0)}
                    </span>
                    <span className="stat-label">Total Earnings</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-container" style={{ background: '#f3e8ff' }}>
                    <SwapHorizIcon style={{ color: '#9333ea' }} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{swapitems.length}</span>
                    <span className="stat-label">Swaps Completed</span>
                  </div>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="impact-summary-card">
                <div className="impact-header">
                  <EnergySavingsLeafIcon className="impact-icon" />
                  <h3>Your Sustainability Impact</h3>
                </div>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <Co2Icon className="impact-stat-icon" />
                    <div className="impact-stat-info">
                      <span className="impact-stat-value">{metrics?.co2_kg || 0} kg</span>
                      <span className="impact-stat-label">CO2 Saved</span>
                    </div>
                  </div>
                  <div className="impact-stat">
                    <WaterDropIcon className="impact-stat-icon" />
                    <div className="impact-stat-info">
                      <span className="impact-stat-value">{metrics?.water_liters || 0} gal</span>
                      <span className="impact-stat-label">Water Saved</span>
                    </div>
                  </div>
                  <div className="impact-stat">
                    <RecyclingIcon className="impact-stat-icon" />
                    <div className="impact-stat-info">
                      <span className="impact-stat-value">{soldCount + swapitems.length}</span>
                      <span className="impact-stat-label">Items Recycled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="actions-grid">
                  <Link to="/upload" className="action-card">
                    <AddIcon className="action-icon" />
                    <span>List New Item</span>
                  </Link>
                  <button className="action-card" onClick={() => setActiveTab('listings')}>
                    <InventoryIcon className="action-icon" />
                    <span>View Listings</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('purchases')}>
                    <ShoppingBagIcon className="action-icon" />
                    <span>Track Orders</span>
                  </button>
                  <Link to="/settings" className="action-card">
                    <SettingsIcon className="action-icon" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <div className="section-header">
                  <h3 className="section-title">Recent Listings</h3>
                  <button className="view-all-btn" onClick={() => setActiveTab('listings')}>
                    View All <ArrowForwardIcon fontSize="small" />
                  </button>
                </div>
                <div className="activity-list">
                {filteredListings
                  .slice() // copy so we don't mutate the original array
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
                  .map(item => (
                    <div key={item.id} className="activity-item">
                      <img src={item.image} alt={item.title} className="activity-image" />
                      <div className="activity-info">
                        <span className="activity-title">{item.title}</span>
                        <span className="activity-meta">${item.price.toFixed(2)} • {item.views} views</span>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="dashboard-content">
              <div className="content-header">
                <div>
                  <h1 className="content-title">My Listings</h1>
                  <p className="content-subtitle">Manage your items for sale or swap</p>
                </div>
                <Link to="/upload" className="primary-btn">
                  <AddIcon /> List New Item
                </Link>
              </div>

              {/* Filter Tabs */}
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${listingsFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setListingsFilter('all')}
                >
                  All {ownersitems.length}
                </button>
                <button
                  className={`filter-tab ${listingsFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setListingsFilter('active')}
                >
                  Active {ownersitems.filter(item => item.status === "available").length}
                </button>
                <button
                  className={`filter-tab ${listingsFilter === 'sold' ? 'active' : ''}`}
                  onClick={() => setListingsFilter('sold')}
                >
                  Sold {soldCount}
                </button>
              </div>

              {/* Listings Grid */}
              <div className="listings-grid">
                {filteredListings.map(item => ( 
                  <div key={item.id} className="listing-card">
                    <div className="listing-image-container">
                      <img src={item.image} alt={item.title} className="listing-image" />
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="listing-info">
                      <h4 className="listing-title">{item.title}</h4>
                      <p className="listing-price">${item.price.toFixed(2)}</p>
                      <p className="listing-meta">
                        <VisibilityIcon fontSize="small" /> {item.views} views
                      </p>
                    </div>
                    <div className="listing-actions">
                      <button className="listing-action-btn" title="View"
                      onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </button>
                      <button className="listing-action-btn" title="Edit"
                        onClick={() => navigate(`/item/${item.id}/edit`)}
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button className="listing-action-btn delete" title="Delete"
                      onClick={() => handleDelete(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredListings.length === 0 && (
                <div className="empty-state">
                  <InventoryIcon className="empty-icon" />
                  <h3>No listings found</h3>
                  <p>Start selling by listing your first item!</p>
                  <Link to="/upload" className="primary-btn">
                    <AddIcon /> List Your First Item
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="dashboard-content">
              <div className="content-header">
                <h1 className="content-title">Purchase History</h1>
                <p className="content-subtitle">Track your orders and deliveries</p>
              </div>

              <div className="orders-list">
                {/* {purchaseHistory.map(order => ( */}
                 {purchasedItems.map(order => (
                  <div key={order.id} className="order-card">
                    <img src={order.image} alt={order.title} className="order-image" />
                    <div className="order-details">
                      <h4 className="order-title">{order.title}</h4>
                      <p className="order-meta">
                        Sold by {order.seller_name} • {order.date}
                        {/* Sold by {order.seller} • {order.date} */}

                      </p>
                      <p className="order-price">${order.price.toFixed(2)}</p>
                    </div>
                    <div className="order-status">
                      {getStatusBadge(order.status)}
                      {order.status === 'shipped' && (
                        <button className="track-btn">
                          <LocalShippingIcon fontSize="small" /> Track
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {purchaseHistory.length === 0 && (
                <div className="empty-state">
                  <ShoppingBagIcon className="empty-icon" />
                  <h3>No purchases yet</h3>
                  <p>Browse our collection to find your next sustainable piece!</p>
                  <Link to="/" className="primary-btn">
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Swaps Tab */}
          {activeTab === 'swaps' && (
            <div className="dashboard-content">
              <div className="content-header">
                <h1 className="content-title">Swap History</h1>
                <p className="content-subtitle">Your clothing exchanges with other members</p>
              </div>

              <div className="swaps-list">
                {swapitems.map((swap) => (
                  <div key={swap.id} className="swap-card">
                    <div className="swap-items">
                      <div className="swap-item">
                        <img
                          src={swap.user1_item?.image || "/fallback-image.png"}
                          alt={swap.user1_item?.name || "Item"}
                        />
                        <span className="swap-item-label">You gave</span>
                        <span className="swap-item-title">  {swap.user1_item?.name || "No item"}</span>
                      </div>
                      <div className="swap-arrow">
                        <SwapHorizIcon />
                      </div>
                      <div className="swap-item">
                        <img
                          src={swap.user2_item?.image || "/fallback-image.png"}
                          alt={swap.user2_item?.name || "Item"}
                        />
                        <span className="swap-item-label">You received</span>
                        <span className="swap-item-title">{swap.user2_item?.name || "No item"}</span>
                      </div>
                    </div>
                    <div className="swap-info">
                      <p>Swapped with <strong>{swap.user2_name}</strong></p>
                      <p className="swap-date">{swap.created_at}</p>
                      {getStatusBadge(swap.status)}
                    </div>
                  </div>
                ))}
              </div>

              {swapHistory.length === 0 && (
                <div className="empty-state">
                  <SwapHorizIcon className="empty-icon" />
                  <h3>No swaps yet</h3>
                  <p>Start swapping clothes with other sustainable fashion lovers!</p>
                  <Link to="/" className="primary-btn">
                    Browse Items to Swap
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Seller Tab */}
          {activeTab === 'seller' && (
            <div className="dashboard-content">
              <div className="content-header">
                <h1 className="content-title">Seller Dashboard</h1>
                <p className="content-subtitle">Manage your sales, payouts, and Stripe account</p>
              </div>

              {sellerLoading ? (
                <p style={{ textAlign: 'center', color: '#666', padding: 40 }}>Loading seller data...</p>
              ) : !sellerAccount?.stripe_account_id ? (
                <div className="empty-state">
                  <StorefrontIcon className="empty-icon" />
                  <h3>Set Up Your Seller Account</h3>
                  <p>Complete Stripe onboarding to start receiving payments for your items.</p>
                  <Link to="/seller-onboarding" className="primary-btn">
                    <AddIcon /> Start Selling
                  </Link>
                </div>
              ) : (
                <>
                  {/* Account Status */}
                  <div style={{
                    background: sellerAccount?.onboarding_complete ? '#ecfdf5' : '#fffbeb',
                    border: `1px solid ${sellerAccount?.onboarding_complete ? '#6ee7b7' : '#fcd34d'}`,
                    borderRadius: 12, padding: 20, marginBottom: 24,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      {sellerAccount?.onboarding_complete ? (
                        <CheckCircleIcon style={{ color: '#059669' }} />
                      ) : (
                        <PendingIcon style={{ color: '#d97706' }} />
                      )}
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: sellerAccount?.onboarding_complete ? '#065f46' : '#92400e', margin: 0 }}>
                        {sellerAccount?.onboarding_complete ? 'Stripe Account Active' : 'Onboarding Incomplete'}
                      </h3>
                    </div>
                    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                      {sellerAccount?.onboarding_complete
                        ? 'Your account is fully set up. Payments will be deposited according to your payout schedule.'
                        : 'Please complete your Stripe onboarding to receive payouts.'}
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      {sellerAccount?.onboarding_complete && (
                        <button
                          onClick={async () => {
                            setDashboardLinkLoading(true);
                            try {
                              const result = await ClothingAPI.getStripeDashboardLink();
                              window.open(result.url, '_blank');
                            } catch (err) {
                              alert(err.message || 'Failed to open Stripe Dashboard');
                            } finally {
                              setDashboardLinkLoading(false);
                            }
                          }}
                          disabled={dashboardLinkLoading}
                          className="primary-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <OpenInNewIcon fontSize="small" />
                          {dashboardLinkLoading ? 'Opening...' : 'Open Stripe Dashboard'}
                        </button>
                      )}
                      {!sellerAccount?.onboarding_complete && (
                        <Link to="/seller-onboarding" className="primary-btn">
                          Complete Onboarding
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Balance Cards */}
                  {sellerBalance && (
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                      <div className="stat-card">
                        <div className="stat-icon-container" style={{ background: '#ecfdf5' }}>
                          <AccountBalanceWalletIcon style={{ color: '#10b981' }} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">${(sellerBalance.in_transit || 0).toFixed(2)}</span>
                          <span className="stat-label">In Transit</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon-container" style={{ background: '#fef3c7' }}>
                          <PendingIcon style={{ color: '#f59e0b' }} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">${(sellerBalance.pending_payout || 0).toFixed(2)}</span>
                          <span className="stat-label">Pending Payout</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon-container" style={{ background: '#dbeafe' }}>
                          <TrendingUpIcon style={{ color: '#3b82f6' }} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">${(sellerBalance.total_paid_out || 0).toFixed(2)}</span>
                          <span className="stat-label">Total Paid Out</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seller Orders */}
                  <div className="recent-activity">
                    <div className="section-header">
                      <h3 className="section-title">Recent Orders</h3>
                    </div>
                    {sellerOrders.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No orders yet.</p>
                    ) : (
                      <div className="orders-list">
                        {sellerOrders.map(order => (
                          <div key={order.order_id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid #f3f4f6' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 600, fontSize: 15, color: '#111827', margin: 0 }}>
                                Order #{order.order_id}
                              </p>
                              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                                Item #{order.clothing_id} &bull; Buyer #{order.buyer_user_id}
                              </p>
                              {order.tracking_number && (
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                                  Tracking: {order.tracking_number}
                                </p>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontWeight: 700, fontSize: 15, color: '#059669', margin: 0 }}>
                                ${Number(order.seller_net || 0).toFixed(2)}
                              </p>
                              {getStatusBadge(order.order_status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Impact Tab */}
          {activeTab === 'impact' && (
            <div className="dashboard-content">
              <div className="content-header">
                <h1 className="content-title">Your Environmental Impact</h1>
                <p className="content-subtitle">See how your sustainable choices make a difference</p>
              </div>

              <div className="impact-cards">
                <div className="impact-detail-card co2">
                  <div className="impact-detail-icon">
                    <Co2Icon />
                  </div>
                  <div className="impact-detail-info">
                    <span className="impact-detail-value">{metrics?.co2_kg || 0} kg</span>
                    <span className="impact-detail-label">CO2 Emissions Saved</span>
                    <p className="impact-detail-description">
                      Equivalent to driving {Math.round((metrics?.co2_kg || 0) * 2.5)} fewer miles
                    </p>
                  </div>
                </div>

                <div className="impact-detail-card water">
                  <div className="impact-detail-icon">
                    <WaterDropIcon />
                  </div>
                  <div className="impact-detail-info">
                    <span className="impact-detail-value">{metrics?.water_liters || 0} gal</span>
                    <span className="impact-detail-label">Water Saved</span>
                    <p className="impact-detail-description">
                      Equivalent to {Math.round((metrics?.water_liters || 0) / 50)} loads of laundry
                    </p>
                  </div>
                </div>

                <div className="impact-detail-card recycled">
                  <div className="impact-detail-icon">
                    <RecyclingIcon />
                  </div>
                  <div className="impact-detail-info">
                    <span className="impact-detail-value">{soldCount + swapitems.length}</span>
                    <span className="impact-detail-label">Items Given New Life</span>
                    <p className="impact-detail-description">
                      Keeping clothing out of landfills
                    </p>
                  </div>
                </div>
              </div>

              <div className="impact-message">
                <EnergySavingsLeafIcon className="impact-message-icon" />
                <div>
                  <h3>You're making a difference!</h3>
                  <p>
                    By choosing pre-loved fashion, you're helping reduce the environmental impact of the
                    clothing industry. Every item swapped or resold is one less item in a landfill.
                  </p>
                </div>
              </div>

              <div className="impact-breakdown">
                <h3 className="section-title">Impact Breakdown by Sold Items</h3>
                <div className="breakdown-list">
                {getsoldItems.map(item => {
                  // Find the impact for this specific item
                  const impact = solditemsimpact.find(i => i.id === item.id)?.impact || { co2: 0, water: 0 };

                  return (
                    <div key={item.id} className="breakdown-item">
                      <img src={item.image} alt={item.title} />
                      <div className="breakdown-info">
                        <span className="breakdown-title">{item.title}</span>
                      </div>
                      <div className="breakdown-impact">
                        <span>
                          <Co2Icon fontSize="small" /> ~{impact.co2}
                        </span>
                        <span>
                          <WaterDropIcon fontSize="small" /> ~{impact.water}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
