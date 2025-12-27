import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import RecipientDashboard from './pages/RecipientDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';

// Home Page
function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>
        İyilikte <span style={{ color: 'hsl(var(--primary))' }}>Sınır Yok</span>
      </h1>
      <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
        İhtiyaç sahipleri ile yardımseverleri buluşturan dijital askıda yemek platformu.
        Bir yemek ısmarlayın, bir kalbe dokunun.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
        <Link to="/register" className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.2rem', textDecoration: 'none' }}>Hemen Başla</Link>
        <Link to="/login" className="btn btn-secondary" style={{ padding: '15px 40px', fontSize: '1.2rem', textDecoration: 'none' }}>Giriş Yap</Link>
      </div>

      <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'left' }}>
        <div className="card">
          <h3 style={{ color: 'hsl(var(--primary))' }}>❤️ Bağış Yap</h3>
          <p>Size en yakın restoranı seçin, dilediğiniz kadar yemek menüsünü askıya bırakın.</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'hsl(var(--secondary))' }}>🍲 Yemek Al</h3>
          <p>İhtiyaç sahibiyseniz, anonim olarak askıdaki yemeklerden faydalanın.</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'hsl(var(--accent))' }}>🤝 Restoranlar</h3>
          <p>İşletmenizi kaydedin, kendi menünüzü oluşturun ve iyilik hareketine katılın.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/recipient" element={<RecipientDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/restaurant-panel" element={<RestaurantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Layout>
  );
}
