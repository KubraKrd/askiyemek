import { useState } from 'react';

export default function PaymentModal({ amount, onClose, onConfirm }) {
    const [processing, setProcessing] = useState(false);
    const [cardData, setCardData] = useState({
        holder: '',
        number: '',
        expiry: '',
        cvc: ''
    });

    const handleFormatCardNumber = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        val = val.substring(0, 16);
        val = val.match(/.{1,4}/g)?.join(' ') || val;
        setCardData({ ...cardData, number: val });
    };

    const handleFormatExpiry = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        setCardData({ ...cardData, expiry: val });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        // Simulate API delay
        setTimeout(() => {
            setProcessing(false);
            onConfirm();
        }, 2000);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            animation: 'fadeIn 0.3s'
        }}>
            <div className="card animate-fade-in" style={{ width: '400px', maxWidth: '90%', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: 'none' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', zIndex: 1 }}
                >
                    ✕
                </button>

                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.8rem' }}>Güvenli Ödeme</h2>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: '#f5f5f5', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>TOPLAM TUTAR</div>
                    <strong style={{ color: 'var(--primary)', fontSize: '2rem' }}>{amount} TL</strong>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>Kart Üzerindeki İsim</label>
                    <input
                        className="input"
                        placeholder="Ad Soyad"
                        value={cardData.holder}
                        onChange={e => setCardData({ ...cardData, holder: e.target.value })}
                        required
                        style={{ border: '2px solid #eee' }}
                    />

                    <label>Kart Numarası</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="input"
                            placeholder="0000 0000 0000 0000"
                            value={cardData.number}
                            onChange={handleFormatCardNumber}
                            maxLength={19}
                            required
                            style={{ fontFamily: 'monospace', letterSpacing: '2px', paddingLeft: '40px' }}
                        />
                        <span style={{ position: 'absolute', left: '12px', top: '14px', fontSize: '1.2rem' }}>💳</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Son Kullanma</label>
                            <input
                                className="input"
                                placeholder="AA/YY"
                                value={cardData.expiry}
                                onChange={handleFormatExpiry}
                                maxLength={5}
                                required
                                style={{ textAlign: 'center' }}
                            />
                        </div>
                        <div>
                            <label>CVC</label>
                            <input
                                className="input"
                                placeholder="123"
                                maxLength={3}
                                value={cardData.cvc}
                                onChange={e => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '') })}
                                required
                                style={{ textAlign: 'center', letterSpacing: '2px' }}
                                type="password"
                            />
                        </div>
                    </div>

                    <button disabled={processing} className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '15px', fontSize: '1.1rem' }}>
                        {processing ? 'Ödeme İişleniyor...' : 'Ödemeyi Onayla'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span>🔒</span> 256-bit SSL şifreleme ile korunmaktadır.
                    </div>
                </form>
            </div>
        </div>
    );
}
