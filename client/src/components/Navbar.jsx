import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '1rem 0', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: '1.8rem', fontWeight: '800', textDecoration: 'none', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Askıda Yemek
                </Link>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!user ? (
                        <>
                            <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '8px 20px' }}>Giriş Yap</Link>
                            <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 20px' }}>Kayıt Ol</Link>
                        </>
                    ) : (
                        <>
                            <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Merhaba, {user.name}</span>
                            {user.role === 'Donor' && <Link to="/donor" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Bağış Yap</Link>}
                            {user.role === 'Recipient' && <Link to="/recipient" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Yemek İste</Link>}
                            {user.role === 'Staff' && <Link to="/staff" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Personel</Link>}
                            {user.role === 'Restaurant' && <Link to="/restaurant-panel" className="btn btn-secondary" style={{ textDecoration: 'none' }}>İşletmem</Link>}
                            {user.role === 'Admin' && <Link to="/admin" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Yönetim</Link>}
                            <button onClick={handleLogout} className="btn" style={{ background: '#f1f1f1', color: '#666' }}>Çıkış</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
