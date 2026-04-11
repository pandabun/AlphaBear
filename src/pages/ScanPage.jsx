/**
 * src/pages/ScanPage.jsx
 * Scan Struk → Ke Pengeluaran (split bill dihapus)
 */

import { useState, useRef } from 'react';
import { scanReceipt, formatIDR } from '../lib/ocr';

const GRADIENT = 'linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)';
const PURPLE = '#C44DFF';
const VIOLET = '#8B5CF6';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Svg = ({ d, d2, size = 24, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const IcoCamera  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcoUpload  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const IcoCheck   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoTrash   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoEdit    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoPlus    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoSpin    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IcoImage   = () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IcoBack    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;

const CATEGORIES = [
  { id: 'shopping',      label: 'Belanja' },
  { id: 'food',          label: 'Makanan' },
  { id: 'home',          label: 'Rumah' },
  { id: 'travel',        label: 'Perjalanan' },
  { id: 'entertainment', label: 'Hiburan' },
  { id: 'work',          label: 'Pekerjaan' },
  { id: 'sport',         label: 'Olahraga' },
];

// ── Styles helpers ────────────────────────────────────────────────────────────
const card = (extra = {}) => ({
  background: 'white',
  borderRadius: 20,
  boxShadow: '0 4px 24px rgba(180,120,255,0.08)',
  padding: '18px 20px',
  marginBottom: 14,
  ...extra,
});

const btn = (bg = GRADIENT, color = 'white', extra = {}) => ({
  background: bg, color, border: 'none', borderRadius: 14,
  padding: '13px 20px', fontSize: 15, fontWeight: 600,
  width: '100%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: "'DM Sans', sans-serif",
  ...extra,
});

const input = (extra = {}) => ({
  width: '100%', padding: '10px 13px', borderRadius: 11,
  border: '1.5px solid #E8E0F0', fontSize: 14,
  background: 'white', color: '#1A1035',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box', outline: 'none',
  ...extra,
});

// ── Komponen ──────────────────────────────────────────────────────────────────
export default function ScanPage({ onSaveTransaction, showToast }) {
  const [step, setStep]           = useState('upload'); // upload | scanning | review | saving
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setPreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [items, setItems]         = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [usePPN, setUsePPN]       = useState(false);
  const [useService, setUseService] = useState(false);
  const [discount, setDiscount]   = useState(0);
  const [note, setNote]           = useState('');
  const [category, setCategory]   = useState('shopping');
  const [error, setError]         = useState(null);

  const fileRef   = useRef(null);
  const cameraRef = useRef(null);

  // ── Kalkulasi ───────────────────────────────────────────────────────────────
  const subtotal    = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const taxAmt      = usePPN    ? Math.round(subtotal * 0.11) : 0;
  const serviceAmt  = useService ? Math.round(subtotal * 0.05) : 0;
  const discountAmt = Math.round(Number(discount) || 0);
  const grandTotal  = subtotal + taxAmt + serviceAmt - discountAmt;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    setError(null);
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    setStep('scanning');
    setError(null);
    try {
      const result = await scanReceipt(imageFile);
      setOcrResult(result);
      setItems(result.items.map((item, i) => ({ ...item, id: `item-${i}` })));
      if (result.discount > 0) setDiscount(result.discount);
      if (result.store)        setNote(`Belanja di ${result.store}`);
      setStep('review');
    } catch (err) {
      setError(err.message || 'Scan gagal. Coba foto ulang.');
      setStep('upload');
    }
  };

  const handleSave = async () => {
    setStep('saving');
    try {
      await onSaveTransaction({
        type: 'expense',
        title: note.trim() || (ocrResult?.store ? `Belanja di ${ocrResult.store}` : 'Scan Struk'),
        amount: grandTotal,
        category,
        date: ocrResult?.date || new Date().toISOString().split('T')[0],
        note: `${items.length} item · scan struk`,
      });
      showToast?.('Pengeluaran berhasil disimpan! 🎉', 'success');
      handleReset();
    } catch {
      setError('Gagal menyimpan. Coba lagi.');
      setStep('review');
    }
  };

  const handleReset = () => {
    setStep('upload'); setImageFile(null); setPreview(null);
    setOcrResult(null); setItems([]); setEditingId(null);
    setUsePPN(false); setUseService(false); setDiscount(0);
    setNote(''); setCategory('shopping'); setError(null);
  };

  const updateItem = (id, field, val) =>
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, [field]: field === 'name' ? val : Math.round(Number(val) || 0) } : i
    ));

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const addItem = () => {
    const id = `item-${Date.now()}`;
    setItems(prev => [...prev, { id, name: 'Item baru', qty: 1, unit_price: 0, total_price: 0 }]);
    setEditingId(id);
  };

  // ── STEP: Upload ────────────────────────────────────────────────────────────
  if (step === 'upload') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)', paddingBottom: 100 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background: GRADIENT, padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'white' }}>Scan Struk</h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          Foto struk → otomatis tercatat sebagai pengeluaran
        </p>
      </div>

      <div style={{ padding: '20px 16px 0', animation: 'fadeIn 0.3s ease' }}>
        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F5', border: '1.5px solid #FFB3CC', borderRadius: 14, padding: '12px 16px', marginBottom: 14, color: '#CC2255', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Preview area */}
        <div
          onClick={() => !imagePreview && fileRef.current?.click()}
          style={{
            ...card({ padding: 0, overflow: 'hidden', minHeight: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: imagePreview ? 'none' : '2px dashed #E0D4F0',
              cursor: imagePreview ? 'default' : 'pointer',
            })
          }}
        >
          {imagePreview ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <img src={imagePreview} alt="Struk" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 20 }} />
              <button
                onClick={e => { e.stopPropagation(); setPreview(null); setImageFile(null); }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'white', cursor: 'pointer', fontSize: 15 }}
              >✕</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#C4B5FD', padding: '36px 20px' }}>
              <IcoImage />
              <p style={{ margin: '10px 0 4px', fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>Tap untuk pilih gambar</p>
              <p style={{ margin: 0, fontSize: 12, color: '#C4B5FD' }}>JPG, PNG atau WEBP — maks 10MB</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button style={btn(`linear-gradient(135deg,${PURPLE},${VIOLET})`, 'white', { flex: 1 })}
            onClick={() => cameraRef.current?.click()}>
            <IcoCamera /> Kamera
          </button>
          <button style={btn('white', PURPLE, { flex: 1, border: `2px solid ${PURPLE}` })}
            onClick={() => fileRef.current?.click()}>
            <IcoUpload /> Galeri
          </button>
        </div>

        {imagePreview && (
          <button style={btn(GRADIENT)} onClick={handleScan}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
            Scan Struk Sekarang
          </button>
        )}
      </div>

      <input ref={fileRef}   type="file" accept="image/*"                    style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );

  // ── STEP: Scanning ──────────────────────────────────────────────────────────
  if (step === 'scanning') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 20, color: PURPLE }}><IcoSpin /></div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1A1035' }}>Sedang Scan...</h2>
        <p style={{ margin: 0, color: '#9CA3AF', fontSize: 14 }}>AI sedang membaca struk kamu</p>
        {imagePreview && (
          <img src={imagePreview} alt="" style={{ width: 100, height: 140, objectFit: 'cover', borderRadius: 12, marginTop: 24, opacity: 0.55, border: `3px solid ${PURPLE}` }} />
        )}
      </div>
    </div>
  );

  // ── STEP: Review ────────────────────────────────────────────────────────────
  if (step === 'review' || step === 'saving') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)', paddingBottom: 100 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background: GRADIENT, padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setStep('upload')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '7px 10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <IcoBack />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'white' }}>Review Struk</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              {ocrResult?.store || 'Edit jika ada yang kurang tepat'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', animation: 'fadeIn 0.3s ease' }}>

        {error && (
          <div style={{ background: '#FFF0F5', border: '1.5px solid #FFB3CC', borderRadius: 14, padding: '12px 16px', marginBottom: 14, color: '#CC2255', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Daftar Item ── */}
        <div style={card()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1A1035' }}>{items.length} Item</h3>
            <button onClick={addItem} style={{ background: '#F5EEFF', border: `1.5px solid ${PURPLE}`, borderRadius: 10, padding: '5px 12px', color: PURPLE, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans',sans-serif" }}>
              <IcoPlus /> Tambah
            </button>
          </div>

          {items.map(item => (
            <div key={item.id} style={{ borderRadius: 12, border: '1.5px solid #F0E8FF', marginBottom: 8, overflow: 'hidden' }}>
              {editingId === item.id ? (
                // Edit mode
                <div style={{ padding: 12 }}>
                  <input style={input({ marginBottom: 8 })} value={item.name}
                    onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Nama item" />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Qty</div>
                      <input type="number" style={input()} value={item.qty} min="1"
                        onChange={e => { updateItem(item.id, 'qty', e.target.value); updateItem(item.id, 'total_price', item.unit_price * Number(e.target.value)); }} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Harga satuan</div>
                      <input type="number" style={input()} value={item.unit_price}
                        onChange={e => { updateItem(item.id, 'unit_price', e.target.value); updateItem(item.id, 'total_price', item.qty * Number(e.target.value)); }} />
                    </div>
                  </div>
                  <button style={btn(GRADIENT, 'white', { padding: '9px' })} onClick={() => setEditingId(null)}>
                    <IcoCheck /> Selesai
                  </button>
                </div>
              ) : (
                // View mode
                <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1035', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{item.qty}× {formatIDR(item.unit_price)}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: VIOLET, flexShrink: 0 }}>{formatIDR(item.qty * item.unit_price)}</div>
                  <button onClick={() => setEditingId(item.id)} style={{ background: '#F5EEFF', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: PURPLE, display: 'flex' }}><IcoEdit /></button>
                  <button onClick={() => removeItem(item.id)} style={{ background: '#FFF0F5', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#FF4D7D', display: 'flex' }}><IcoTrash /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Pajak & Biaya ── */}
        <div style={card()}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#1A1035' }}>Pajak & Biaya</h3>

          {/* PPN */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1035' }}>PPN 11%</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{usePPN ? formatIDR(taxAmt) : 'Tidak dikenakan'}</div>
            </div>
            <Toggle on={usePPN} onToggle={() => setUsePPN(v => !v)} />
          </div>

          {/* Service */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1035' }}>Service Charge 5%</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{useService ? formatIDR(serviceAmt) : 'Tidak dikenakan'}</div>
            </div>
            <Toggle on={useService} onToggle={() => setUseService(v => !v)} />
          </div>

          {/* Diskon */}
          <div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Diskon (Rp)</div>
            <input type="number" style={input()} placeholder="0" value={discount || ''}
              onChange={e => setDiscount(e.target.value)} />
          </div>
        </div>

        {/* ── Ringkasan Total ── */}
        <div style={card()}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#1A1035' }}>Ringkasan</h3>
          <TotalRow label="Subtotal" value={formatIDR(subtotal)} />
          {usePPN    && <TotalRow label="PPN 11%"         value={formatIDR(taxAmt)} />}
          {useService && <TotalRow label="Service Charge"  value={formatIDR(serviceAmt)} />}
          {discountAmt > 0 && <TotalRow label="Diskon" value={`- ${formatIDR(discountAmt)}`} green />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 8, borderTop: '2px solid #F0E8FF' }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1A1035' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatIDR(grandTotal)}
            </span>
          </div>
        </div>

        {/* ── Catatan & Kategori ── */}
        <div style={card()}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Judul pengeluaran</div>
            <input style={input()} value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={ocrResult?.store ? `Belanja di ${ocrResult.store}` : 'Belanja'} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: 600 }}>Kategori</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${category === c.id ? PURPLE : '#E8E0F0'}`,
                  background: category === c.id ? `${PURPLE}18` : 'white',
                  color: category === c.id ? PURPLE : '#9CA3AF',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Simpan ── */}
        <button style={btn(GRADIENT, 'white', { opacity: step === 'saving' ? 0.7 : 1 })}
          onClick={handleSave} disabled={step === 'saving'}>
          {step === 'saving'
            ? <><IcoSpin /> Menyimpan...</>
            : <><IcoCheck /> Simpan ke Pengeluaran</>}
        </button>

      </div>
    </div>
  );

  return null;
}

// ── Sub-komponen kecil ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 48, height: 26, borderRadius: 13, border: 'none',
      background: on ? 'linear-gradient(135deg,#FF6B9D,#C44DFF)' : '#E0D4F0',
      position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function TotalRow({ label, value, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
      <span style={{ color: green ? '#22C55E' : '#6B7280', fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: green ? '#22C55E' : '#1A1035' }}>{value}</span>
    </div>
  );
}
