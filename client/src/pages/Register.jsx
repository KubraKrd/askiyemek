import { useState } from 'react';
import axios from 'axios';

import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

export default function Register() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Donor'
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/auth/register`, formData);
            alert('Kayıt başarılı! Lütfen giriş yapın.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Kayıt başarısız oldu.');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Hesap Oluştur</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <label>Ad Soyad</label>
                    <input name="full_name" placeholder="Adınız Soyadınız" className="input" onChange={handleChange} required />

                    <label>E-Posta</label>
                    <input name="email" type="email" placeholder="ornek@email.com" className="input" onChange={handleChange} required />

                    <label>Telefon</label>
                    <input name="phone" placeholder="0555..." className="input" onChange={handleChange} />

                    <label>Şifre</label>
                    <input name="password" type="password" placeholder="******" className="input" onChange={handleChange} required />

                    <label>Kullanıcı Rolü:</label>
                    <select name="role" className="input" onChange={handleChange} value={formData.role}>
                        <option value="Donor">Bağışçı (Yemek Ismarlamak İstiyorum)</option>
                        <option value="Recipient">İhtiyaç Sahibi (Yemek İstiyorum)</option>
                        <option value="Restaurant">Restoran Sahibi (İşletmemi Ekleyeceğim)</option>
                    </select>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Kayıt Ol</button>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a href="/login" style={{ textDecoration: 'none', color: 'var(--primary)' }}>Zaten hesabınız var mı? Giriş Yap</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
