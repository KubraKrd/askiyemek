import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import API_URL from '../config';

export default function DonorDashboard() {
    const { user } = useContext(AuthContext);
    const [restaurants, setRestaurants] = useState([]);
    const [menu, setMenu] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [msg, setMsg] = useState('');
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        // Fetch Restaurants
        axios.get(`${API_URL}/api/meals/restaurants`)
            .then(res => {
                setRestaurants(res.data);
                if (res.data.length > 0) {
                    setSelectedRestaurant(res.data[0].id);
                }
            })
            .catch(err => console.error(err));
    }, []);

    // When restaurant changes, fetch its menu
    useEffect(() => {
        if (selectedRestaurant) {
            axios.get(`${API_URL}/api/meals/menu/${selectedRestaurant}`)
                .then(res => {
                    setMenu(res.data);
                    if (res.data.length > 0) setSelectedMealType(res.data[0].id);
                    else setSelectedMealType('');
                })
                .catch(console.error);
        }
    }, [selectedRestaurant]);

    const handleDonateClick = (e) => {
        e.preventDefault();
        setShowPayment(true);
    };

    const handlePaymentSuccess = async () => {
        setShowPayment(false);
        try {
            await axios.post(`${API_URL}/api/meals/donate`, {
                restaurant_id: selectedRestaurant,
                donor_id: user.id,
                meal_type_id: selectedMealType,
                quantity: quantity
            });
            setMsg('Ödeme Başarılı! Bağışınız askıya bırakıldı. Teşekkür ederiz. ❤️');
            setTimeout(() => setMsg(''), 5000);
            setQuantity(1); // Reset quantity
        } catch (err) {
            setMsg('Bağış işlemi sırasında bir hata oluştu.');
        }
    };

    const calculateTotal = () => {
        const item = menu.find(m => m.id == selectedMealType);
        return item ? item.price * quantity : 0;
    };

    if (restaurants.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h2>Henüz kayıtlı restoran yok.</h2>
                <p>Sistemde henüz aktif bir restoran bulunmamaktadır. Lütfen daha sonra tekrar deneyiniz.</p>
            </div>
        );
    }

    return (
        <div>
            {showPayment && (
                <PaymentModal
                    amount={calculateTotal()}
                    onClose={() => setShowPayment(false)}
                    onConfirm={handlePaymentSuccess}
                />
            )}

            <h1>Bağışçı Paneli</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>İyilik yapmak için bir restoran ve menü seçin.</p>

            <div className="card" style={{ maxWidth: '1000px', marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Askıya Yemek Bırak</h2>
                {msg && <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', background: msg.includes('hata') ? '#ffebee' : '#e8f5e9', color: msg.includes('hata') ? '#c62828' : '#2e7d32' }}>{msg}</div>}

                <form onSubmit={handleDonateClick}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label>Önce Restoran Seçiniz:</label>
                        <select className="input" value={selectedRestaurant} onChange={e => setSelectedRestaurant(e.target.value)} style={{ fontSize: '1.1rem' }}>
                            {restaurants.map(r => (
                                <option key={r.id} value={r.id}>{r.name} - {r.city}/{r.district}</option>
                            ))}
                        </select>
                    </div>

                    {menu.length > 0 ? (
                        <>
                            <label style={{ marginBottom: '1rem', display: 'block' }}>Hangi Yemeği Ismarlamak İstersiniz?</label>

                            {/* Visual Grid for Menus */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                {menu.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedMealType(m.id)}
                                        className="animate-fade-in"
                                        style={{
                                            cursor: 'pointer',
                                            border: selectedMealType === m.id ? '3px solid var(--primary)' : '1px solid #ddd',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            background: 'white',
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                            transform: selectedMealType === m.id ? 'translateY(-5px)' : 'none',
                                            boxShadow: selectedMealType === m.id ? '0 10px 25px rgba(255, 100, 50, 0.25)' : '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        {m.image_url ?
                                            <div style={{ height: '160px', overflow: 'hidden' }}>
                                                <img src={m.image_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                                            </div>
                                            : <div style={{ height: '160px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🍽️</div>
                                        }
                                        <div style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px' }}>{m.name}</div>
                                            <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.2rem' }}>{m.price} TL</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '2rem', maxWidth: '200px' }}>
                                <label>Kaç Adet?</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    style={{ fontSize: '1.2rem', padding: '10px' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                <span>💳</span> Ödeme Yap ve Askıya As ({calculateTotal()} TL)
                            </button>
                        </>
                    ) : (
                        <p style={{ color: '#c62828', textAlign: 'center', padding: '2rem', background: '#ffebee', borderRadius: '12px' }}>
                            Bu restoranın henüz menüsü bulunmuyor. Lütfen başka bir restoran seçiniz.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
