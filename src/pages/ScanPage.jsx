/**
 * ScanPage.jsx — Halaman Scan Struk (Real OCR via OpenRouter)
 *
 * Drop-in replacement untuk halaman Scan Struk di App.jsx.
 * Fitur:
 * - Upload gambar ATAU kamera langsung (mobile)
 * - Real OCR via OpenRouter (google/gemini-flash-1.5)
 * - Edit item hasil scan
 * - Toggle PPN (10%) dan service charge (5%)
 * - Input diskon manual
 * - Mode: "Ke Pengeluaran" atau "Split Bill"
 * - Auto-save ke Supabase transactions
 */

import { useState, useRef, useCallback } from 'react';
import { scanReceipt, formatIDR } from '../lib/ocr';

const GRADIENT = 'linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)';
const PINK = '#FF6B9D';
const PURPLE = '#C44DFF';
const VIOLET = '#8B5CF6';

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconScan = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="14" y1="14" x2="21" y2="14"/>
    <line x1="14" y1="21" x2="21" y2="21"/>
    <line x1="14" y1="17.5" x2="21" y2="17.5"/>
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconSpinner = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconImage = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

// ── Komponen Utama ────────────────────────────────────────────────────────────
export default function ScanPage({ onSaveTransaction, showToast }) {
  const [mode, setMode] = useState(null); // null | 'expense' | 'split'
  const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'review' | 'split' | 'saving'
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [items, setItems] = useState([]);
  const [usePPN, setUsePPN] = useState(true);
  const [useService, setUseService] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [splitCount, setSplitCount] = useState(2);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [expenseNote, setExpenseNote] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ── Kalkulasi ───────────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
  const taxAmount = usePPN ? Math.round(subtotal * 0.11) : 0; // PPN 11% (Indonesia 2022+)
  const serviceAmount = useService ? Math.round(subtotal * 0.05) : 0;
  const discountAmount = Math.round(Number(discount) || 0);
  const grandTotal = subtotal + taxAmount + serviceAmount - discountAmount;
  const perPerson = splitCount > 0 ? Math.ceil(grandTotal / splitCount) : grandTotal;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    setError(null);
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleFileInput = (e) => handleFile(e.target.files?.[0]);

  const handleScan = async () => {
    if (!imageFile) return;
    setStep('scanning');
    setError(null);

    try {
      const result = await scanReceipt(imageFile);
      setOcrResult(result);
      setItems(result.items.map((item, i) => ({ ...item, id: `item-${i}` })));
      // Pre-fill discount dari hasil scan
      if (result.discount > 0) setDiscount(result.discount);
      // Pre-fill note dari nama toko
      if (result.store) setExpenseNote(`Belanja di ${result.store}`);
      setStep('review');
    } catch (err) {
      setError(err.message || 'Gagal scan struk. Coba foto ulang.');
      setStep('upload');
    }
  };

  const handleSaveExpense = async () => {
    if (!onSaveTransaction) return;
    setStep('saving');
    try {
      await onSaveTransaction({
        type: 'expense',
        title: expenseNote || (ocrResult?.store ? `Belanja di ${ocrResult.store}` : 'Scan Struk'),
        amount: grandTotal,
        category: 'Belanja',
        date: ocrResult?.date || new Date().toISOString().split('T')[0],
        note: `Scan struk — ${items.length} item`,
      });
      showToast?.('Pengeluaran berhasil disimpan! 🎉', 'success');
      handleReset();
    } catch {
      setError('Gagal menyimpan. Coba lagi.');
      setStep('review');
    }
  };

  const handleReset = () => {
    setMode(null);
    setStep('upload');
    setImagePreview(null);
    setImageFile(null);
    setOcrResult(null);
    setItems([]);
    setUsePPN(true);
    setUseService(false);
    setDiscount(0);
    setSplitCount(2);
    setEditingItem(null);
    setError(null);
    setExpenseNote('');
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, [field]: field === 'name' ? value : Math.round(Number(value) || 0) }
        : item
    ));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    const id = `item-${Date.now()}`;
    setItems(prev => [...prev, { id, name: 'Item baru', qty: 1, unit_price: 0, total_price: 0 }]);
    setEditingItem(id);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FDF4FF 0%, #F8F5FF 40%, #FFF5FB 100%)',
      paddingBottom: '100px',
      fontFamily: "'DM Sans', sans-serif",
    },
    header: {
      background: GRADIENT,
      padding: '20px 20px 28px',
      color: 'white',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '700',
      margin: 0,
    },
    headerSub: {
      fontSize: '13px',
      opacity: 0.85,
      marginTop: '4px',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 4px 24px rgba(180,120,255,0.08)',
      margin: '0 16px 16px',
      padding: '20px',
      overflow: 'hidden',
    },
    btn: (bg, color = 'white') => ({
      background: bg,
      color,
      border: 'none',
      borderRadius: '14px',
      padding: '14px 20px',
      fontSize: '15px',
      fontWeight: '600',
      width: '100%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: "'DM Sans', sans-serif",
    }),
    modeBtn: (active) => ({
      flex: 1,
      padding: '14px',
      borderRadius: '14px',
      border: `2px solid ${active ? PURPLE : '#E8E0F0'}`,
      background: active ? 'linear-gradient(135deg, #FDF0FF, #F0EBFF)' : 'white',
      cursor: 'pointer',
      textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.2s',
    }),
    toggle: (on) => ({
      width: '48px',
      height: '26px',
      borderRadius: '13px',
      background: on ? GRADIENT : '#E0D4F0',
      position: 'relative',
      cursor: 'pointer',
      border: 'none',
      flexShrink: 0,
      transition: 'background 0.2s',
    }),
    toggleKnob: (on) => ({
      position: 'absolute',
      top: '3px',
      left: on ? '25px' : '3px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: 'white',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
    }),
    label: {
      fontSize: '13px',
      color: '#888',
      marginBottom: '6px',
      display: 'block',
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      borderRadius: '12px',
      border: '1.5px solid #E8E0F0',
      fontSize: '14px',
      background: 'white',
      color: '#1A1035',
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box',
      outline: 'none',
    },
    totalRow: (bold) => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderTop: bold ? '2px solid #F0E8FF' : 'none',
      marginTop: bold ? '8px' : 0,
    }),
  };

  // ─── Render: Mode Selection ─────────────────────────────────────────────────
  if (!mode) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'white' }}><IconScan /></div>
            <div>
              <h1 style={s.headerTitle}>Scan Struk</h1>
              <p style={s.headerSub}>Scan & simpan otomatis ke dompet kamu</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px 0' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            Pilih mode scan:
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={s.modeBtn(mode === 'expense')} onClick={() => setMode('expense')}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🛍️</div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1A1035' }}>Ke Pengeluaran</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Simpan total ke dompet</div>
            </button>
            <button style={s.modeBtn(mode === 'split')} onClick={() => setMode('split')}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>👥</div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1A1035' }}>Split Bill</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Bagi rata ke beberapa orang</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Upload Step ────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleReset} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px', color: 'white', cursor: 'pointer' }}>←</button>
            <div>
              <h1 style={s.headerTitle}>{mode === 'expense' ? 'Scan ke Pengeluaran' : 'Scan Split Bill'}</h1>
              <p style={s.headerSub}>Foto atau upload gambar struk</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px 0' }}>
          {/* Preview area */}
          <div style={{
            ...s.card,
            margin: '0 0 16px',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px dashed ${imagePreview ? 'transparent' : '#E0D4F0'}`,
            padding: imagePreview ? 0 : '40px 20px',
            cursor: imagePreview ? 'default' : 'pointer',
          }}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={imagePreview} alt="Preview struk" style={{ width: '100%', borderRadius: '20px', maxHeight: '350px', objectFit: 'contain' }} />
                <button onClick={() => { setImagePreview(null); setImageFile(null); }} style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', color: 'white', cursor: 'pointer', fontSize: '16px',
                }}>✕</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#B8A4CC' }}>
                <IconImage />
                <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: '600' }}>Tap untuk pilih gambar</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>JPG, PNG, atau WEBP — maks 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#FFF0F5', border: '1.5px solid #FFB3CC', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#CC2255', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            {/* Camera button (mobile: langsung buka kamera) */}
            <button style={{ ...s.btn(`linear-gradient(135deg, ${PURPLE}, ${VIOLET})`), flex: 1 }}
              onClick={() => cameraInputRef.current?.click()}>
              <IconCamera /> Kamera
            </button>
            {/* Gallery button */}
            <button style={{ ...s.btn('white', PURPLE), flex: 1, border: `2px solid ${PURPLE}` }}
              onClick={() => fileInputRef.current?.click()}>
              <IconUpload /> Galeri
            </button>
          </div>

          {imagePreview && (
            <button style={s.btn(GRADIENT)} onClick={handleScan}>
              <IconScan /> Scan Struk Sekarang
            </button>
          )}

          {/* Hidden inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileInput} />
        </div>
      </div>
    );
  }

  // ─── Render: Scanning ───────────────────────────────────────────────────────
  if (step === 'scanning') {
    return (
      <div style={{ ...s.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ color: PURPLE, marginBottom: '20px' }}><IconSpinner /></div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1035', marginBottom: '8px' }}>Sedang Scan...</h2>
          <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5 }}>
            AI sedang membaca struk kamu.<br />Biasanya 3–8 detik.
          </p>
          {imagePreview && (
            <img src={imagePreview} alt="Struk" style={{
              width: '120px', height: '160px', objectFit: 'cover',
              borderRadius: '12px', marginTop: '24px', opacity: 0.6,
              border: `3px solid ${PURPLE}`,
            }} />
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Review ─────────────────────────────────────────────────────────
  if (step === 'review' || step === 'saving') {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setStep('upload')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px', color: 'white', cursor: 'pointer' }}>←</button>
            <div>
              <h1 style={s.headerTitle}>Review Struk</h1>
              <p style={s.headerSub}>{ocrResult?.store || 'Edit item jika ada yang salah'}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {error && (
            <div style={{ background: '#FFF0F5', border: '1.5px solid #FFB3CC', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', color: '#CC2255', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Items */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1A1035' }}>
                {items.length} Item
              </h3>
              <button onClick={addItem} style={{
                background: 'linear-gradient(135deg, #FDF0FF, #F0EBFF)',
                border: `1.5px solid ${PURPLE}`,
                borderRadius: '10px',
                padding: '6px 12px',
                color: PURPLE,
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <IconPlus /> Tambah
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} style={{
                borderRadius: '12px',
                border: '1.5px solid #F0E8FF',
                marginBottom: '8px',
                overflow: 'hidden',
              }}>
                {editingItem === item.id ? (
                  // Edit mode
                  <div style={{ padding: '12px' }}>
                    <input
                      style={{ ...s.input, marginBottom: '8px' }}
                      value={item.name}
                      onChange={e => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Nama item"
                    />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={s.label}>Qty</span>
                        <input type="number" style={s.input} value={item.qty} min="1"
                          onChange={e => { updateItem(item.id, 'qty', e.target.value); updateItem(item.id, 'total_price', item.unit_price * Number(e.target.value)); }} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <span style={s.label}>Harga satuan</span>
                        <input type="number" style={s.input} value={item.unit_price}
                          onChange={e => { updateItem(item.id, 'unit_price', e.target.value); updateItem(item.id, 'total_price', item.qty * Number(e.target.value)); }} />
                      </div>
                    </div>
                    <button style={{ ...s.btn(GRADIENT), padding: '10px' }} onClick={() => setEditingItem(null)}>
                      <IconCheck /> Selesai
                    </button>
                  </div>
                ) : (
                  // View mode
                  <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#1A1035', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{item.qty}x {formatIDR(item.unit_price)}</div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: VIOLET, flexShrink: 0 }}>
                      {formatIDR(item.qty * item.unit_price)}
                    </div>
                    <button onClick={() => setEditingItem(item.id)} style={{ background: '#F5EEFF', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: PURPLE }}>
                      <IconEdit />
                    </button>
                    <button onClick={() => removeItem(item.id)} style={{ background: '#FFF0F5', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#FF4D7D' }}>
                      <IconTrash />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pengaturan pajak & biaya */}
          <div style={s.card}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700', color: '#1A1035' }}>Pajak & Biaya</h3>

            {/* PPN Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1A1035' }}>PPN 11%</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{usePPN ? formatIDR(taxAmount) : 'Tidak dikenakan'}</div>
              </div>
              <button style={s.toggle(usePPN)} onClick={() => setUsePPN(!usePPN)}>
                <div style={s.toggleKnob(usePPN)} />
              </button>
            </div>

            {/* Service Charge Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1A1035' }}>Service Charge 5%</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{useService ? formatIDR(serviceAmount) : 'Tidak dikenakan'}</div>
              </div>
              <button style={s.toggle(useService)} onClick={() => setUseService(!useService)}>
                <div style={s.toggleKnob(useService)} />
              </button>
            </div>

            {/* Diskon */}
            <div>
              <span style={s.label}>Diskon (Rp)</span>
              <input
                type="number"
                style={s.input}
                placeholder="0"
                value={discount || ''}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>
          </div>

          {/* Total */}
          <div style={s.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#1A1035' }}>Ringkasan</h3>
            <div style={s.totalRow()}>
              <span style={{ color: '#666', fontSize: '14px' }}>Subtotal</span>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{formatIDR(subtotal)}</span>
            </div>
            {usePPN && <div style={s.totalRow()}>
              <span style={{ color: '#666', fontSize: '14px' }}>PPN 11%</span>
              <span style={{ fontSize: '14px' }}>{formatIDR(taxAmount)}</span>
            </div>}
            {useService && <div style={s.totalRow()}>
              <span style={{ color: '#666', fontSize: '14px' }}>Service Charge</span>
              <span style={{ fontSize: '14px' }}>{formatIDR(serviceAmount)}</span>
            </div>}
            {discountAmount > 0 && <div style={s.totalRow()}>
              <span style={{ color: '#22C55E', fontSize: '14px' }}>Diskon</span>
              <span style={{ color: '#22C55E', fontSize: '14px' }}>- {formatIDR(discountAmount)}</span>
            </div>}
            <div style={{ ...s.totalRow(true) }}>
              <span style={{ fontWeight: '800', fontSize: '16px', color: '#1A1035' }}>Total</span>
              <span style={{ fontWeight: '800', fontSize: '18px', background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatIDR(grandTotal)}
              </span>
            </div>

            {/* Split Bill info */}
            {mode === 'split' && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1.5px solid #F0E8FF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Jumlah orang</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${PURPLE}`, background: 'white', color: PURPLE, fontWeight: '700', fontSize: '18px', cursor: 'pointer' }}>−</button>
                    <span style={{ fontWeight: '700', fontSize: '18px', color: '#1A1035', minWidth: '24px', textAlign: 'center' }}>{splitCount}</span>
                    <button onClick={() => setSplitCount(splitCount + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: GRADIENT, color: 'white', fontWeight: '700', fontSize: '18px', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #FDF0FF, #F0EBFF)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Per orang</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {formatIDR(perPerson)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catatan (mode expense) */}
          {mode === 'expense' && (
            <div style={{ ...s.card }}>
              <span style={s.label}>Catatan transaksi</span>
              <input
                style={s.input}
                value={expenseNote}
                onChange={e => setExpenseNote(e.target.value)}
                placeholder={ocrResult?.store ? `Belanja di ${ocrResult.store}` : 'Belanja supermarket'}
              />
            </div>
          )}

          {/* Action buttons */}
          {mode === 'expense' ? (
            <div style={{ padding: '0 0 20px' }}>
              <button style={s.btn(GRADIENT)} onClick={handleSaveExpense} disabled={step === 'saving'}>
                {step === 'saving' ? <><IconSpinner /> Menyimpan...</> : <><IconCheck /> Simpan ke Pengeluaran</>}
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 0 20px' }}>
              <button style={s.btn(GRADIENT)} onClick={handleReset}>
                <IconCheck /> Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
