import { useState, useEffect } from 'react';
import axios from 'axios';

import API_URL from '../config';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total_users: 0, total_restaurants: 0, active_meals: 0, redeemed_meals: 0 });
    const [view, setView] = useState('dashboard'); // dashboard, users, restaurants
    const [dataList, setDataList] = useState([]);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = () => {
        axios.get(`${API_URL}/api/admin/stats`)
            .then(res => setStats(res.data))
            .catch(console.error);
    };

    const fetchUsers = () => {
        axios.get(`${API_URL}/api/admin/users`)
            .then(res => {
                setDataList(res.data);
                setView('users');
            })
            .catch(console.error);
    };

    const fetchRestaurants = () => {
        axios.get(`${API_URL}/api/meals/restaurants`)
            .then(res => {
                setDataList(res.data);
                setView('restaurants');
            })
            .catch(console.error);
    };

    const handleDelete = (type, id) => {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

        const endpoint = type === 'user' ? `/api/admin/users/${id}` : `/api/admin/restaurants/${id}`;
        axios.delete(`${API_URL}${endpoint}`)
            .then(() => {
                setMsg('Kayıt silindi.');
                setTimeout(() => setMsg(''), 3000);
                // Refresh list
                if (type === 'user') fetchUsers();
                else fetchRestaurants();
                fetchStats(); // Update stats too
            })
            .catch(err => alert('Silme işlemi başarısız: ' + (err.response?.data?.error || 'Hata')));
    };

    return (
        <div>
            <h1>Yönetici Paneli</h1>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)', color: 'white' }}>
                    <h3>Toplam Kullanıcı</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.total_users}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #22A6B3 100%)', color: 'white' }}>
                    <h3>Restoranlar</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.total_restaurants}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%)', color: 'white' }}>
                    <h3>Askıdaki Yemekler</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.active_meals}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', color: '#2d3436' }}>
                    <h3>Ulaşan Yardımlar</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.redeemed_meals}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => setView('dashboard')}>Ana Görünüm</button>
                <button className="btn btn-primary" onClick={fetchUsers}>Kullanıcıları Yönet</button>
                <button className="btn btn-primary" onClick={fetchRestaurants}>Restoranları Yönet</button>
            </div>

            {msg && <div style={{ padding: '10px', background: '#d4edda', color: '#155724', borderRadius: '5px', marginBottom: '1rem' }}>{msg}</div>}

            {/* Dynamic Content */}
            <div className="card animate-fade-in">
                {view === 'dashboard' && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <h3>Hoş Geldiniz, Yönetici</h3>
                        <p>Yukarıdaki butonları kullanarak sistemdeki kayıtları yönetebilirsiniz.</p>
                    </div>
                )}

                {view === 'users' && (
                    <div>
                        <h2>Kullanıcı Listesi</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>ID</th>
                                    <th style={{ padding: '10px' }}>Ad Soyad</th>
                                    <th style={{ padding: '10px' }}>E-Posta</th>
                                    <th style={{ padding: '10px' }}>Rol</th>
                                    <th style={{ padding: '10px' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataList.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '10px' }}>{u.id}</td>
                                        <td style={{ padding: '10px' }}>{u.full_name}</td>
                                        <td style={{ padding: '10px' }}>{u.email}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                                background: u.role === 'Admin' ? '#000' : u.role === 'Restaurant' ? 'var(--primary)' : '#eee',
                                                color: u.role === 'Admin' || u.role === 'Restaurant' ? 'white' : '#333'
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            {u.role !== 'Admin' && (
                                                <button className="btn" style={{ background: '#ff7675', color: 'white', padding: '5px 10px', fontSize: '0.9rem' }} onClick={() => handleDelete('user', u.id)}>
                                                    Sil 🗑️
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'restaurants' && (
                    <div>
                        <h2>Restoran Listesi</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>ID</th>
                                    <th style={{ padding: '10px' }}>Restoran Adı</th>
                                    <th style={{ padding: '10px' }}>Konum</th>
                                    <th style={{ padding: '10px' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataList.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '10px' }}>{r.id}</td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {r.image_url ? <img src={r.image_url} style={{ width: '30px', height: '30px', borderRadius: '50%' }} /> : '🍽️'}
                                                {r.name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px' }}>{r.city} / {r.district}</td>
                                        <td style={{ padding: '10px' }}>
                                            <button className="btn" style={{ background: '#ff7675', color: 'white', padding: '5px 10px', fontSize: '0.9rem' }} onClick={() => handleDelete('restaurant', r.id)}>
                                                Sil 🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
