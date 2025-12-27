import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../config';

export default function RestaurantDashboard() {
    const { user } = useContext(AuthContext);
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'staff'

    // Forms
    const [createForm, setCreateForm] = useState({ name: '', city: 'İstanbul', district: '', image_url: '' });
    const [menuForm, setMenuForm] = useState({ name: '', price: '', image_url: '' });
    const [staffForm, setStaffForm] = useState({ full_name: '', email: '', password: '' });

    const [showMenuForm, setShowMenuForm] = useState(false);
    const [showStaffForm, setShowStaffForm] = useState(false);

    const [msg, setMsg] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchRestaurant();
    }, [user.id]);

    const fetchRestaurant = () => {
        axios.get(`${API_URL}/api/meals/my-restaurant/${user.id}`)
            .then(res => {
                setRestaurant(res.data);
                if (res.data) {
                    fetchMenu(res.data.id);
                    fetchStaff(res.data.id);
                }
            })
            .catch(err => console.error(err));
    };

    const fetchMenu = (restId) => {
        axios.get(`${API_URL}/api/meals/menu/${restId}`)
            .then(res => setMenu(res.data))
            .catch(console.error);
    };

    const fetchStaff = (restId) => {
        axios.get(`${API_URL}/api/meals/staff/${restId}`)
            .then(res => setStaffList(res.data))
            .catch(console.error);
    };

    const handleFileUpload = async (e, targetFormSetter) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const res = await axios.post(`${API_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            targetFormSetter(prev => ({ ...prev, image_url: res.data.url }));
            setUploading(false);
        } catch (err) {
            console.error(err);
            setMsg('Dosya yüklenirken hata oluştu.');
            setUploading(false);
        }
    };

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/meals/restaurants`, {
                owner_id: user.id,
                ...createForm
            });
            setMsg('Restoran başarıyla oluşturuldu! Şimdi menü ekleyebilirsiniz.');
            fetchRestaurant();
        } catch (err) {
            console.error(err);
            setMsg('Hata oluştu.');
        }
    };

    const handleAddMenuItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/meals/menu`, {
                restaurant_id: restaurant.id,
                ...menuForm
            });
            setMsg('Menü ürünü eklendi.');
            setMenuForm({ name: '', price: '', image_url: '' });
            setShowMenuForm(false);
            fetchMenu(restaurant.id);
        } catch (err) {
            setMsg('Hata oluştu.');
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/meals/staff`, {
                restaurant_id: restaurant.id,
                ...staffForm
            });
            setMsg('Personel hesabı oluşturuldu.');
            setStaffForm({ full_name: '', email: '', password: '' });
            setShowStaffForm(false);
            fetchStaff(restaurant.id);
        } catch (err) {
            setMsg('Hata: ' + (err.response?.data?.error || 'Bilinmeyen hata'));
        }
    };

    // --- DELETE HANDLERS ---
    const handleDeleteMenu = (id) => {
        if (!confirm('Bu menü öğesini silmek istediğinize emin misiniz?')) return;
        axios.delete(`${API_URL}/api/meals/menu/${id}`)
            .then(() => {
                setMsg('Ürün silindi.');
                fetchMenu(restaurant.id);
            })
            .catch(err => setMsg('Silme başarısız.'));
    };

    const handleDeleteStaff = (id) => {
        if (!confirm('Bu personel hesabını silmek istediğinize emin misiniz?')) return;
        axios.delete(`${API_URL}/api/meals/staff/${id}`)
            .then(() => {
                setMsg('Personel silindi.');
                fetchStaff(restaurant.id);
            })
            .catch(err => setMsg('Silme başarısız.'));
    };

    if (!restaurant) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card">
                    <h2>Restoranınızı Kaydedin</h2>
                    <p>Sisteme dahil olmak için işletme bilgilerinizi giriniz.</p>
                    <form onSubmit={handleCreateRestaurant}>
                        <label>İşletme Adı</label>
                        <input className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Şehir</label>
                                <input className="input" value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} required />
                            </div>
                            <div>
                                <label>İlçe</label>
                                <input className="input" value={createForm.district} onChange={e => setCreateForm({ ...createForm, district: e.target.value })} required />
                            </div>
                        </div>

                        <label>Kapak Fotoğrafı</label>
                        <input type="file" className="input" accept="image/*" onChange={(e) => handleFileUpload(e, setCreateForm)} />
                        {uploading && <p style={{ color: 'blue' }}>Yükleniyor...</p>}
                        {createForm.image_url && <img src={createForm.image_url} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />}

                        <button className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>Kaydet ve Başla</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {restaurant.image_url && <img src={restaurant.image_url} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />}
                    <div>
                        <h1 style={{ margin: 0 }}>{restaurant.name}</h1>
                        <small style={{ color: '#666' }}>{restaurant.city}, {restaurant.district}</small>
                    </div>
                </div>
                <div>
                    <button className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('menu')} style={{ marginRight: '10px' }}>Menü Yönetimi</button>
                    <button className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('staff')}>Personel Yönetimi</button>
                </div>
            </div>

            {msg && <div style={{ padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            {activeTab === 'menu' && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Menü Listesi</h2>
                        <button className="btn btn-primary" onClick={() => setShowMenuForm(!showMenuForm)}>+ Yeni Ürün Ekle</button>
                    </div>

                    {showMenuForm && (
                        <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
                            <h3>Yeni Yemek Ekle</h3>
                            <form onSubmit={handleAddMenuItem}>
                                <label>Yemek Adı</label>
                                <input className="input" value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} required />

                                <label>Fiyat (TL)</label>
                                <input type="number" className="input" value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} required />

                                <label>Yemek Görseli</label>
                                <input type="file" className="input" accept="image/*" onChange={(e) => handleFileUpload(e, setMenuForm)} />
                                {uploading && <p style={{ color: 'blue' }}>Yükleniyor...</p>}
                                {menuForm.image_url && <img src={menuForm.image_url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem', display: 'block' }} />}

                                <button className="btn btn-primary" disabled={uploading}>Menüye Ekle</button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {menu.map(m => (
                            <div key={m.id} className="card" style={{ padding: '1rem', position: 'relative' }}>
                                <button
                                    onClick={() => handleDeleteMenu(m.id)}
                                    style={{ position: 'absolute', top: '5px', right: '5px', background: '#c62828', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
                                >
                                    🗑️
                                </button>
                                {m.image_url ? (
                                    <img src={m.image_url} alt={m.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '120px', background: '#eee', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
                                )}
                                <strong>{m.name}</strong>
                                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{m.price} TL</div>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Askıya Uygun</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'staff' && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Personel Listesi</h2>
                        <button className="btn btn-primary" onClick={() => setShowStaffForm(!showStaffForm)}>+ Personel Hesabı Ekle</button>
                    </div>

                    {showStaffForm && (
                        <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
                            <h3>Yeni Personel Kaydı</h3>
                            <form onSubmit={handleAddStaff}>
                                <label>Ad Soyad</label>
                                <input className="input" value={staffForm.full_name} onChange={e => setStaffForm({ ...staffForm, full_name: e.target.value })} required />

                                <label>E-Posta</label>
                                <input type="email" className="input" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />

                                <label>Şifre</label>
                                <input type="password" className="input" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required />

                                <button className="btn btn-primary">Personeli Kaydet</button>
                            </form>
                        </div>
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '10px' }}>Ad Soyad</th>
                                <th style={{ padding: '10px' }}>E-Posta</th>
                                <th style={{ padding: '10px' }}>Durum</th>
                                <th style={{ padding: '10px' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{s.full_name}</td>
                                    <td style={{ padding: '10px' }}>{s.email}</td>
                                    <td style={{ padding: '10px' }}><span style={{ color: 'green', fontWeight: 'bold' }}>Aktif</span></td>
                                    <td style={{ padding: '10px' }}>
                                        <button className="btn" style={{ background: '#ff7675', color: 'white', padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => handleDeleteStaff(s.id)}>
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
    );
}
