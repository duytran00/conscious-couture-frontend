import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClothingAPI from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CONDITIONS = [
    { label: "Brand New - Never worn, tags attached", value: "brand_new" },
    { label: "Like New - Worn once or twice, perfect condition", value: "like_new" },
    { label: "Excellent - Gently used, no visible wear", value: "used_excellent" },
    { label: "Good - Normal wear, minor signs of use", value: "used_good" },
    { label: "Fair - Visible wear but still functional", value: "used_fair" }
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL",
    "28", "29", "30", "31", "32", "33", "34", "36", "38", "40",
    "6", "7", "8", "9", "10", "11", "12", "13", "One Size"];

const COLORS = [
    "Black", "White", "Blue", "Red", "Green", "Navy",
    "Grey", "Brown", "Tan", "Pink", "Purple", "Yellow",
    "Orange", "Multi-color", "Other"
];

const EditItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [notOwner, setNotOwner] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        condition: '',
        size: '',
        color: '',
        brand: '',
        sell_price: '',
    });

    const [originalItem, setOriginalItem] = useState(null);

    // Load item data
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const loadItem = async () => {
            try {
                setLoading(true);
                const item = await ClothingAPI.getClothingItem(id);
                setOriginalItem(item);

                // Check ownership
                const currentUserId = parseInt(user?.id);
                if (item.owner_user_id !== currentUserId) {
                    setNotOwner(true);
                    setLoading(false);
                    return;
                }

                setFormData({
                    description: item.description || '',
                    condition: item.condition || '',
                    size: item.size || '',
                    color: item.color || '',
                    brand: item.brand || '',
                    sell_price: item.sell_price != null ? String(item.sell_price) : '',
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadItem();
    }, [id, isAuthenticated, user, navigate]);

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSaving(true);

        try {
            const updateData = {};

            // Only send fields that changed
            if (formData.description !== (originalItem.description || '')) {
                updateData.description = formData.description;
            }
            if (formData.condition !== (originalItem.condition || '')) {
                updateData.condition = formData.condition;
            }
            if (formData.size !== (originalItem.size || '')) {
                updateData.size = formData.size;
            }
            if (formData.color !== (originalItem.color || '')) {
                updateData.color = formData.color;
            }
            if (formData.brand !== (originalItem.brand || '')) {
                updateData.brand = formData.brand;
            }

            const newPrice = formData.sell_price ? parseFloat(formData.sell_price) : null;
            const oldPrice = originalItem.sell_price != null ? parseFloat(originalItem.sell_price) : null;
            if (newPrice !== oldPrice) {
                updateData.sell_price = newPrice;
            }

            if (Object.keys(updateData).length === 0) {
                setError('No changes to save.');
                setSaving(false);
                return;
            }

            await ClothingAPI.updateClothingItem(id, updateData);
            setSuccess(true);
            setTimeout(() => navigate(`/item/${id}`), 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;

        try {
            setSaving(true);
            await ClothingAPI.deleteClothingItem(id);
            navigate('/dashboard?tab=listings');
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    // ── Render states ──

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#666' }}>Loading item...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (notOwner) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Not Your Listing</h2>
                    <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>You can only edit items that you own.</p>
                    <button
                        onClick={() => navigate(`/item/${id}`)}
                        style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Back to Item
                    </button>
                </div>
            </div>
        );
    }

    const itemName = originalItem?.description || 'Item';
    const itemImage = originalItem?.primary_image_url;

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                    <button onClick={() => navigate(`/item/${id}`)}
                        style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '8px' }}>
                        ←
                    </button>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Edit Listing</h1>
                        <p style={{ fontSize: 14, color: '#888', margin: '4px 0 0' }}>Update your item details</p>
                    </div>
                </div>

                {/* Alerts */}
                {success && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>✓</span>
                        <span style={{ color: '#065f46', fontWeight: 600 }}>Changes saved! Redirecting...</span>
                    </div>
                )}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>⚠</span>
                        <span style={{ color: '#991b1b', fontWeight: 500 }}>{error}</span>
                    </div>
                )}

                {/* Item preview strip */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 20, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 64, height: 80, borderRadius: 12, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {itemImage
                            ? <img src={itemImage} alt={itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 28 }}>📦</span>
                        }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemName}</p>
                        <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
                            {originalItem?.clothing_type} • {originalItem?.size} • ID #{id}
                        </p>
                    </div>
                    <span style={{
                        background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                        {originalItem?.status || 'available'}
                    </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSave}>
                    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eee', padding: 32, marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: '#10b981', color: '#fff', width: 24, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>1</span>
                            Basic Details
                        </h3>

                        {/* Description */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={handleChange('description')}
                                rows={3}
                                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                                placeholder="Describe your item..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Condition */}
                            <div>
                                <label style={labelStyle}>Condition</label>
                                <select value={formData.condition} onChange={handleChange('condition')} style={inputStyle}>
                                    <option value="">Select...</option>
                                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>

                            {/* Size */}
                            <div>
                                <label style={labelStyle}>Size</label>
                                <select value={formData.size} onChange={handleChange('size')} style={inputStyle}>
                                    <option value="">Select...</option>
                                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Color */}
                            <div>
                                <label style={labelStyle}>Color</label>
                                <select value={formData.color} onChange={handleChange('color')} style={inputStyle}>
                                    <option value="">Select...</option>
                                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Brand */}
                            <div>
                                <label style={labelStyle}>Brand</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={handleChange('brand')}
                                    style={inputStyle}
                                    placeholder="e.g., Nike, Zara"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eee', padding: 32, marginBottom: 32 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: '#10b981', color: '#fff', width: 24, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>2</span>
                            Pricing
                        </h3>

                        <div style={{ maxWidth: 280 }}>
                            <label style={labelStyle}>Sell Price (USD)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#888', fontWeight: 600 }}>$</span>
                                <input
                                    type="number"
                                    value={formData.sell_price}
                                    onChange={handleChange('sell_price')}
                                    style={{ ...inputStyle, paddingLeft: 30 }}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>Leave blank for swap-only listing</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={saving}
                            style={{
                                padding: '12px 20px', borderRadius: 12,
                                border: '1px solid #fecaca', background: '#fff', color: '#dc2626',
                                fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.5 : 1,
                            }}
                        >
                            Delete Listing
                        </button>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                type="button"
                                onClick={() => navigate(`/item/${id}`)}
                                style={{
                                    padding: '12px 24px', borderRadius: 12,
                                    border: '1px solid #ddd', background: '#fff', color: '#333',
                                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '12px 32px', borderRadius: 12,
                                    border: 'none', background: saving ? '#9ca3af' : '#10b981', color: '#fff',
                                    fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Shared styles ──
const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#444',
    marginBottom: 6,
};

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e5e7eb', fontSize: 14, color: '#1a1a1a',
    background: '#fafafa', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
};

export default EditItem;