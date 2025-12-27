import Navbar from './Navbar';

export default function Layout({ children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main className="container animate-fade-in" style={{ flex: 1, padding: '3rem 1rem' }}>
                {children}
            </main>
            <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'white', marginTop: 'auto' }}>
                &copy; 2025 Askıda Yemek Yönetim Sistemi. Tüm hakları saklıdır.
            </footer>
        </div>
    );
}
