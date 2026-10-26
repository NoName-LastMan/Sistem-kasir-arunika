import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Customer Portal ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#fafaf9',
          color: '#1c1917',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
            border: '1px solid #e7e5e4',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.25rem auto'
            }}>
              ☕
            </div>

            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#292524' }}>
              Oops! Sedikit Masalah
            </h1>
            <p style={{ color: '#78716c', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Halaman pesanan Arunika mengalami sedikit gangguan. Jangan khawatir, keranjang dan pesanan Anda tetap terjaga.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#b45309',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Muat Ulang Menu
              </button>
              <button
                onClick={this.handleHome}
                style={{
                  backgroundColor: '#f5f5f4',
                  color: '#44403c',
                  fontWeight: 600,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Kembali Awal
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
