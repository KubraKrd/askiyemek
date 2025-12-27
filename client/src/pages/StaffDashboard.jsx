import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function StaffDashboard() {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ active: 0, used: 0 });
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Or import from config

    useEffect(() => {
        if (user.restaurant_id) {
            refreshStats();
        }
    }, [user.restaurant_id]);

    const refreshStats = () => {
        axios.get(`${API_URL}/api/meals/suspended/${user.restaurant_id}`)
            .then(res => {
                const active = res.data.length;
                // Since api/meals/suspended only returns Active meals, we might need another endpoint for stats
                // For now, let's just show Active count available for validaiton context
                setStats(prev => ({ ...prev, active: active }));
            })
            .catch(console.error);
    };

    const handleRedeem = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await axios.post(`${API_URL}/api/transactions/redeem`, {
                code: code,
                restaurant_id: user.restaurant_id, // Automatically use assigned restaurant
                staff_id: user.id
            });
            setMessage(`Başarılı! ${res.data.meal.name} verildi.`);
            setCode('');
            refreshStats(); // Update stats
        } catch (err) {
            setMessage('Hata: ' + (err.response?.data?.error || 'Kod geçersiz veya hata oluştu.'));
        }
    };

    if (!user.restaurant_id) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#c62828' }}>
                <h2>Yetkisiz Erişim</h2>
                <p>Hesabınız herhangi bir restorana atanmamış. Lütfen yöneticinizle iletişime geçin.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1>Personel Paneli</h1>
            <p style={{ color: 'var(--text-muted)' }}>İşletme: <strong style={{ color: 'var(--primary)' }}>{user.restaurant_name || `Restoran #${user.restaurant_id}`}</strong></p>

            <div className="card" style={{ marginTop: '2rem', borderTop: '5px solid var(--primary)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Askıdan Yemek Teslimi</h2>

                {message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        background: message.includes('Hata') ? '#ffebee' : '#e8f5e9',
                        color: message.includes('Hata') ? '#c62828' : '#2e7d32',
                        fontWeight: 'bold'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleRedeem}>
                    <label style={{ fontSize: '1.2rem' }}>Müşteri Kodu</label>
                    <input
                        className="input"
                        placeholder="Örn: Xy9Z2"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '5px', textTransform: 'uppercase' }}
                        required
                    />
                    <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1.2rem', marginTop: '1rem' }}>
                        Kodu Doğrula ve Yemeği Ver
                    </button>
                </form>

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center', color: '#666' }}>
                    Bu restoranda şu an askıda <strong style={{ color: 'var(--primary)' }}>{stats.active}</strong> adet yemek bekliyor.
                </div>
            </div>
        </div>
    );
}
