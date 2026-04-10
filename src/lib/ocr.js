export async function extractReceiptItems(imageBase64) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',  // model yang support vision & murah
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: `Ekstrak semua item dari struk ini. Kembalikan HANYA JSON array dengan format:
[{"name": "nama item", "price": harga_satuan_angka, "qty": jumlah_angka}]
Jangan tambahkan teks lain. Harga dalam Rupiah tanpa titik/koma.`
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  })
  
  const data = await response.json()
  const text = data.choices[0]?.message?.content || '[]'
  
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}