import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = () => {
    const text = `${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard?.writeText(text);
    alert('Detail error telah disalin ke clipboard');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            padding: '2.5rem',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem auto'
            }}>
              ⚠️
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
              Terjadi Kesalahan Aplikasi
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Sistem kasir mengalami kendala tak terduga. Data Anda tetap aman. Silakan muat ulang halaman atau kembali ke menu utama.
            </p>

            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: '#0b0f19',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#f87171',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
                maxHeight: '160px',
                border: '1px solid #1f293d'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                🔄 Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                🏠 Beranda
              </button>
              <button
                onClick={this.handleCopy}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                📋 Salin Error
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
