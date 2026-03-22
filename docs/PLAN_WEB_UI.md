# 🎨 PLAN: Hermetic Librarian Cloud (Vercel Edition)

## 1. MİMARİ VİZYON (ARCHITECTURAL VISION)
Evdeki bilgisayara bağımlılığın tamamen ortadan kaldırıldığı, Vercel üzerinden 7/24 erişilebilir, "SaaS" (Software as a Service) ruhuna sahip profesyonel bir bulut uygulaması.

## 2. TEKNOLOJİ YIĞINI (TECH STACK - FULL CLOUD)
- **Frontend & API:** Next.js (Vercel üzerinden senin subdomain'ine bağlı). 
- **Zeka (LLM API):** Groq API (Llama-3-70B). *Evinizdeki bilgisayardan kat kat hızlıdır ve 7/24 hazırdır.*
- **Bulut Hafıza (Vector DB):** Pinecone veya Supabase Vector. *14GB verini buluta taşır, milisaniyeler içinde arama yapar.*
- **Kullanıcı Verisi (Notlar & Geçmiş):** Supabase (Postgres). 

## 3. ÖZELLİKLER (FEATURES)
- **Cihaz Bağımsızlığı:** Bilgisayarın kapalı olsa dahi telefondan veya herhangi bir tarayıcıdan anında erişim.
- **Subdomain Desteği:** `kutuphane.seninsiten.com` üzerinden kurumsal bir kimlik.
- **Sıfır Bakım:** Terminal, sunucu veya IP ayarlarıyla uğraşmak yok.

## 4. GÖRSEL TASARIM DİSİPLİNİ
- **Palet:** Koyu tema (Kütüphane atmosferi: Derin Gri, Altın Sarısı detaylar).
- **Tipografi:** Klasik ve modernin harmanı (Playfair Display & Inter).

## 5. UYGULAMA ADIMLARI (SERVERLESS PHASES)

### Faz 1: Bulut Hafıza Kurulumu (Data Migration)
- Kitapları Pinecone (Cloud Vector DB) üzerine yüklemek.
- Mevcut `ingest.py` komutunu Pinecone Cloud'a bağlanacak şekilde güncellemek.

### Faz 2: API & Next.js Entegrasyonu
- Groq/OpenAI API anahtarlarının Next.js (Vercel) Environment Variables kısmına eklenmesi.
- RAG mantığının Vercel Serverless Functions'a taşınması.

### Faz 3: Yayın (Deployment)
- GitHub repo'sunun Vercel'e bağlanması.
- Subdomain yönlendirmesinin yapılması.

---

✅ **Bilgisayardan bağımsız, Vercel üzerinden çalışan bu modern planı onaylıyor musun? (Y/N)**
- **Y:** GitHub repo'sunu ve Vercel/Pinecone yapılarını kurmaya başlarım.
- **N:** Planı senin isteklerine göre revize ederim.
