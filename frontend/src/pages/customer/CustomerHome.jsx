import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, MapPin, Clock, ArrowRight, Sparkles, Building2, Phone } from 'lucide-react';

export const CustomerHome = ({ onSelectBusiness }) => {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory ? `?category=${selectedCategory}` : '';
      const [bizRes, catRes] = await Promise.all([
        api.get(`/customer/businesses${catParam}`),
        api.get('/customer/categories'),
      ]);

      if (bizRes.success) setBusinesses(bizRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section
        style={{
          textAlign: 'center',
          padding: '3.5rem 1rem 2.5rem',
          maxWidth: '780px',
          margin: '0 auto',
        }}
      >
     

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.25rem',
          }}
        >
          Pick your place{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            before you arrive.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          No physical waiting rooms. No registration required. Select a business, choose your service, get a live queue ticket, and walk in right when it's your turn.
        </p>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '0.5rem 0.6rem 0.5rem 1.25rem',
            boxShadow: 'var(--shadow-lg)',
            gap: '0.75rem',
          }}
        >
          <Search size={20} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search businesses by name, location or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#FFF',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
        </div>
      </section>

      {/* Category Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          marginBottom: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('')}
          style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
        >
          All Businesses
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            className={`btn ${selectedCategory === cat._id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat._id)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Businesses Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading participating businesses...
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <Building2 size={42} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3>No businesses found</h3>
          <p style={{ marginTop: '0.5rem' }}>
            No registered businesses match your search criteria. Try a different filter or search term.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredBusinesses.map((biz) => (
            <div
              key={biz.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#60A5FA',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      fontWeight: 600,
                    }}
                  >
                    {biz.category || 'General'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#34D399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                    Active Queue
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{biz.name}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {biz.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <MapPin size={14} />
                      <span>{biz.location} {biz.address ? `• ${biz.address}` : ''}</span>
                    </div>
                  )}
                  {biz.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Phone size={14} />
                      <span>{biz.phone}</span>
                    </div>
                  )}
                </div>

                {/* Available Services */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Available Services:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {biz.services && biz.services.length > 0 ? (
                      biz.services.map((s) => (
                        <div
                          key={s._id || s.name}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>{s.name}</span>
                          <span style={{ color: '#FBBF24', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            ({s.durationMinutes}m)
                          </span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Default consultation services
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-primary"
                onClick={() => onSelectBusiness(biz)}
                style={{ width: '100%' }}
              >
                <span>Select Business & Join Queue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
