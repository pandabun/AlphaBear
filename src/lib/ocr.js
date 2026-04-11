/**
 * src/lib/ocr.js
 * Real OCR untuk scan struk menggunakan OpenRouter API.
 * Auto-retry dengan beberapa model vision — jika model pertama tidak support
 * image input, otomatis coba model berikutnya tanpa perlu setting manual.
 *
 * Env: VITE_OPENROUTER_API_KEY=sk-or-...
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Daftar model vision (dicoba berurutan, fallback otomatis) ─────────────────
// Semua gratis atau sangat murah di OpenRouter per 2025
const VISION_MODELS = [
  'google/gemini-2.0-flash-001',              // Gemini 2.0 Flash — terbaik, gratis
  'google/gemini-flash-1.5-8b',              // Gemini 1.5 Flash 8B
  'meta-llama/llama-3.2-11b-vision-instruct', // Llama vision — gratis
  'qwen/qwen-2-vl-7b-instruct',              // Qwen VL — bagus untuk teks Asia/IDR
];

// ── Konversi File ke base64 ───────────────────────────────────────────────────
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

// ── Prompt OCR ────────────────────────────────────────────────────────────────
const RECEIPT_PROMPT = `Kamu adalah sistem OCR khusus struk belanja Indonesia.
Ekstrak semua item dari struk ini dan kembalikan HANYA JSON valid, tanpa teks lain, tanpa markdown, tanpa backtick.

Format JSON yang harus dikembalikan:
{
  "store": "nama toko (string, kosong jika tidak jelas)",
  "date": "tanggal struk YYYY-MM-DD (kosong jika tidak ada)",
  "items": [
    {
      "name": "nama item",
      "qty": 1,
      "unit_price": 15000,
      "total_price": 15000
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "service_charge": 0,
  "discount": 0,
  "grand_total": 0,
  "notes": "catatan tambahan jika ada"
}

Aturan:
- Semua harga dalam angka bulat (IDR, tanpa titik/koma)
- Jika qty tidak disebutkan, anggap 1
- Jika unit_price tidak disebutkan, isi sama dengan total_price
- Jika subtotal tidak tertera, hitung dari total semua item
- Jika pajak tidak tertera, biarkan 0
- Pastikan hanya JSON, tidak ada penjelasan apapun`;

// ── Coba satu model, throw jika gagal ─────────────────────────────────────────
async function tryModel(model, base64, mimeType) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AlphaBear Finance Tracker',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: RECEIPT_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respons kosong dari model');

  return { text, model };
}

// ── Error model tidak support vision ─────────────────────────────────────────
function isVisionUnsupportedError(message = '') {
  const lower = message.toLowerCase();
  return (
    lower.includes('no endpoints') ||
    lower.includes('vision') ||
    lower.includes('image input') ||
    lower.includes('multimodal') ||
    lower.includes('not support') ||
    lower.includes('unsupported')
  );
}

// ── Normalisasi hasil OCR ─────────────────────────────────────────────────────
function normalizeOCRResult(raw) {
  const items = (raw.items || []).map((item, idx) => ({
    id: `item-${idx + 1}`,
    name: String(item.name || `Item ${idx + 1}`).trim(),
    qty: Number(item.qty) || 1,
    unit_price: Math.round(Number(item.unit_price) || 0),
    total_price: Math.round(Number(item.total_price) || 0),
  }));

  const itemsTotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const subtotal = Math.round(Number(raw.subtotal) || itemsTotal);
  const tax = Math.round(Number(raw.tax) || 0);
  const service_charge = Math.round(Number(raw.service_charge) || 0);
  const discount = Math.round(Number(raw.discount) || 0);
  const grand_total = Math.round(
    Number(raw.grand_total) || subtotal + tax + service_charge - discount
  );

  return {
    store: String(raw.store || '').trim(),
    date: raw.date || new Date().toISOString().split('T')[0],
    items,
    subtotal,
    tax,
    service_charge,
    discount,
    grand_total,
    notes: String(raw.notes || '').trim(),
    _scanned_at: new Date().toISOString(),
  };
}

// ── Main: scanReceipt ─────────────────────────────────────────────────────────
/**
 * Scan struk menggunakan OpenRouter Vision API.
 * Auto-retry dengan model list jika model pertama tidak support vision.
 *
 * @param {File} imageFile - File gambar struk
 * @returns {Promise<OCRResult>}
 */
export async function scanReceipt(imageFile) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'API Key belum diset. Tambahkan VITE_OPENROUTER_API_KEY di .env.local dan Vercel dashboard.'
    );
  }

  if (!imageFile) throw new Error('File gambar tidak ditemukan');

  // Validasi tipe file
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  if (
    !allowedTypes.includes(imageFile.type) &&
    !imageFile.name?.match(/\.(jpg|jpeg|png|webp|heic)$/i)
  ) {
    throw new Error('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.');
  }

  // Validasi ukuran (max 10MB)
  if (imageFile.size > 10 * 1024 * 1024) {
    throw new Error('File terlalu besar. Maksimal 10MB.');
  }

  // Konversi ke base64
  const { base64, mimeType } = await fileToBase64(imageFile);

  // ── Auto-retry loop ───────────────────────────────────────────────────────
  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      const { text, model: usedModel } = await tryModel(model, base64, mimeType);

      // Parse JSON
      let parsed;
      try {
        const cleaned = text
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // JSON parse gagal — coba model berikutnya
        lastError = new Error('Gagal membaca format respons dari model');
        continue;
      }

      const result = normalizeOCRResult(parsed);
      result._model = usedModel;
      return result;

    } catch (err) {
      lastError = err;

      // Jika error karena model tidak support vision → coba model berikutnya
      if (isVisionUnsupportedError(err.message)) {
        continue;
      }

      // Error lain (auth gagal, quota habis, network) → langsung throw
      if (
        err.message?.includes('401') ||
        err.message?.includes('403') ||
        err.message?.includes('API Key') ||
        err.message?.includes('insufficient')
      ) {
        throw err;
      }

      // Untuk error lain, masih coba model berikutnya
      continue;
    }
  }

  // Semua model habis dicoba
  const hint = lastError?.message?.includes('401') || lastError?.message?.includes('403')
    ? 'Periksa VITE_OPENROUTER_API_KEY kamu.'
    : 'Coba foto ulang dengan pencahayaan lebih terang.';

  throw new Error(`Scan gagal: ${lastError?.message || 'Unknown error'}. ${hint}`);
}

// ── Utilitas ──────────────────────────────────────────────────────────────────
/**
 * Hitung split bill
 */
export function calculateSplitBill(
  ocrResult,
  numPeople = 2,
  includeTax = true,
  includeService = true
) {
  let total = ocrResult.subtotal;
  if (includeTax) total += ocrResult.tax;
  if (includeService) total += ocrResult.service_charge;
  total -= ocrResult.discount;
  return Math.ceil(total / numPeople);
}

/**
 * Format angka ke IDR
 */
export function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
