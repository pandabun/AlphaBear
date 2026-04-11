/**
 * src/lib/ocr.js
 * Real OCR untuk scan struk menggunakan OpenRouter API
 * Model: google/gemini-flash-1.5 (gratis, vision capable)
 *
 * Env: VITE_OPENROUTER_API_KEY=sk-or-...
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model yang dipakai — bisa ganti ke model lain yang support vision
// Opsi gratis: google/gemini-flash-1.5, meta-llama/llama-3.2-11b-vision-instruct
const OCR_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

/**
 * Konversi File/Blob ke base64 data URL
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:image/jpeg;base64,/9j/4AAQ..."
      // Kita butuh hanya bagian base64-nya
      const base64 = reader.result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

/**
 * Prompt untuk ekstrak data struk ke JSON
 */
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

/**
 * Scan struk menggunakan OpenRouter Vision API
 * @param {File} imageFile - File gambar struk dari input[type=file]
 * @returns {Promise<OCRResult>}
 */
export async function scanReceipt(imageFile) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY belum diset di .env.local');
  }

  if (!imageFile) {
    throw new Error('File gambar tidak ditemukan');
  }

  // Validasi file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(imageFile.type) && !imageFile.name?.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
    throw new Error('Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.');
  }

  // Validasi ukuran file (max 10MB)
  if (imageFile.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar. Maksimal 10MB.');
  }

  // Konversi ke base64
  const { base64, mimeType } = await fileToBase64(imageFile);

  // Build request body
  const requestBody = {
    model: OCR_MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
          {
            type: 'text',
            text: RECEIPT_PROMPT,
          },
        ],
      },
    ],
  };

  // Panggil OpenRouter API
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin, // required by OpenRouter
      'X-Title': 'AlphaBear Finance Tracker',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`OpenRouter API error: ${message}`);
  }

  const data = await response.json();

  // Ekstrak teks dari response
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('Respons API kosong atau tidak valid');
  }

  // Parse JSON dari response
  let parsed;
  try {
    // Bersihkan dari markdown fence jika ada (defensive)
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gagal memparse respons OCR. Coba foto ulang dengan pencahayaan lebih baik.');
  }

  // Validasi dan normalisasi output
  return normalizeOCRResult(parsed);
}

/**
 * Normalisasi dan validasi hasil OCR
 */
function normalizeOCRResult(raw) {
  const items = (raw.items || []).map((item, idx) => ({
    id: `item-${idx + 1}`,
    name: String(item.name || `Item ${idx + 1}`).trim(),
    qty: Number(item.qty) || 1,
    unit_price: Math.round(Number(item.unit_price) || 0),
    total_price: Math.round(Number(item.total_price) || 0),
  }));

  // Hitung subtotal dari items jika tidak ada
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
    // Meta
    _scanned_at: new Date().toISOString(),
    _model: OCR_MODEL,
  };
}

/**
 * Hitung split bill dari hasil OCR
 * @param {OCRResult} ocrResult
 * @param {number} numPeople - jumlah orang
 * @param {boolean} includeTax
 * @param {boolean} includeService
 * @returns {number} jumlah per orang
 */
export function calculateSplitBill(ocrResult, numPeople = 2, includeTax = true, includeService = true) {
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
