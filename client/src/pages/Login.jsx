import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            login(res.data);
            // Redirect based on role
            const role = res.data.user.role;
            if (role === 'Donor') navigate('/donor');
            else if (role === 'Recipient') navigate('/recipient');
            else if (role === 'Staff') navigate('/staff');
            else if (role === 'Restaurant') navigate('/restaurant-panel');
            else if (role === 'Admin') navigate('/admin');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem' }}>Hoş Geldiniz</h2>
                {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <label>E-Posta Adresi</label>
                    <input
                        type="email"
                        placeholder="ornek@email.com"
                        className="input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <label>Şifre</label>
                    <input
                        type="password"
                        placeholder="******"
                        className="input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Giriş Yap</button>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a href="/register" style={{ textDecoration: 'none', color: 'var(--primary)' }}>Hesabınız yok mu? Kayıt Ol</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
