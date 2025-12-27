import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../config';

export default function RecipientDashboard() {
    const { user } = useContext(AuthContext);
    const [restaurants, setRestaurants] = useState([]);
    const [activeMeals, setActiveMeals] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState('');
    const [code, setCode] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(`${API_URL}/api/meals/restaurants`)
            .then(res => {
                setRestaurants(res.data);
            })
            .catch(err => console.error(err));
    }, []);

    const loadMeals = (restId) => {
        setSelectedRestaurant(restId);
        axios.get(`${API_URL}/api/meals/suspended/${restId}`)
            .then(res => setActiveMeals(res.data))
            .catch(err => console.error(err));
    };

    const handleRequest = async (mealTypeId) => {
        setError('');
        setCode(null);
        try {
            const res = await axios.post(`${API_URL}/api/transactions/request-code`, {
                recipient_id: user.id,
                restaurant_id: selectedRestaurant,
                meal_type_id: mealTypeId
            });
            setCode(res.data.code);
        } catch (err) {
            setError(err.response?.data?.error || 'Yemek talep edilirken hata oluştu.');
        }
    };

    return (
        <div>
            <h1>Yemek Talep Ekranı</h1>
            <p style={{ color: 'var(--text-muted)' }}>Günlük en fazla 2 askı alabilirsiniz.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem', marginTop: '2rem' }}>
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3>Restoranlar</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>Lütfen bölgenizdeki bir restoranı seçin:</p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {restaurants.map(r => (
                            <li key={r.id} style={{ marginBottom: '0.8rem' }}>
                                <button
                                    className={`btn ${selectedRestaurant === r.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', textAlign: 'left', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    onClick={() => loadMeals(r.id)}
                                >
                                    {r.image_url ?
                                        <img src={r.image_url} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                        : <span>🍽️</span>}
                                    {r.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card">
                    <h3>Mevcut Askıdaki Yemekler</h3>
                    {selectedRestaurant ? (
                        activeMeals.length > 0 ? (
                            <div>
                                {code && (
                                    <div style={{ background: '#e8f5e9', border: '2px solid #4caf50', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)' }}>
                                        <h4 style={{ margin: 0, color: '#2e7d32' }}>TEK KULLANIMLIK KODUNUZ</h4>
                                        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0', letterSpacing: '5px', color: '#1b5e20' }}>{code}</div>
                                        <p style={{ margin: 0 }}>Lütfen bu kodu kasadaki görevliye gösterin.</p>
                                    </div>
                                )}
                                {error && (
                                    <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>
                                )}

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {Object.values(activeMeals.reduce((acc, meal) => {
                                        if (!acc[meal.meal_name]) acc[meal.meal_name] = { ...meal, count: 0 };
                                        acc[meal.meal_name].count++;
                                        return acc;
                                    }, {})).map((m, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px',
                                            border: '1px solid #eee',
                                            borderRadius: '12px',
                                            background: 'white',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {m.image_url ? (
                                                    <img src={m.image_url} alt={m.meal_name} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '80px', height: '80px', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
                                                )}
                                                <div>
                                                    <strong style={{ fontSize: '1.2rem', display: 'block' }}>{m.meal_name}</strong>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', background: 'rgba(255, 100, 50, 0.1)', padding: '4px 8px', borderRadius: '20px', fontSize: '0.9rem' }}>{m.count} Adet Mevcut</span>
                                                </div>
                                            </div>
                                            <button className="btn btn-primary" onClick={() => handleRequest(m.meal_type_id)}>Talep Et</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Bu restoranda şu an askıda yemek bulunmamaktadır.</p>
                    ) : (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Yemekleri listelemek için sol taraftan bir restoran seçiniz.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
