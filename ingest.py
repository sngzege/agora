import os
import argparse
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv(dotenv_path='./web/.env.local')

DOCS_PATH = "./docs"

def main(persona_name):
    # 1. API Anahtarlarını Kontrol Et
    pinecone_key = os.getenv("PINECONE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    index_name = os.getenv("PINECONE_INDEX", "hermetic-library")

    if not pinecone_key or pinecone_key.startswith("pcsk_buraya"):
        print("[HATA] Lütfen web/.env.local dosyasına PINECONE_API_KEY ekleyin.")
        return
    if not openai_key or openai_key.startswith("sk-proj-buraya"):
        print("[HATA] Lütfen web/.env.local dosyasına OPENAI_API_KEY ekleyin.")
        return

    persona_dir = os.path.join(DOCS_PATH, persona_name)
    if not os.path.exists(persona_dir):
        print(f"Klasör bulunamadı: {persona_dir}")
        return
        
    documents = []
    print(f"\n[{persona_name.upper()}] için dosyalar taranıyor...")
    for file in os.listdir(persona_dir):
        file_path = os.path.join(persona_dir, file)
        if file.endswith('.pdf'):
            print(f"- PDF Okunuyor: {file}")
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
        elif file.endswith('.txt') or file.endswith('.md'):
            print(f"- Metin Okunuyor: {file}")
            loader = TextLoader(file_path, encoding='utf-8')
            documents.extend(loader.load())
            
    if not documents:
        print(f"{persona_name} klasöründe hiç döküman bulunamadı.")
        return

    print(f"Toplam {len(documents)} sayfa/döküman işleniyor...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)

    # 2. Vektör Modelini Hazırla (OpenAI text-embedding-3-small)
    print("--> OpenAI Embedding modeli hazırlanıyor...")
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")
    
    # 3. Pinecone Bağlantısı
    print(f"Bulut Veritabanına (Pinecone) yükleniyor [{index_name}] namespace: [{persona_name}]...")
    
    # Vector DB'yi Pinecone üzerinde belirli bir bölüme (namespace) kaydet!
    vectorstore = PineconeVectorStore.from_documents(
        chunks,
        embedding_model,
        index_name=index_name,
        namespace=persona_name # Her karakteri ayrı bir namespace içinde tutar
    )
    
    print(f"\n✅ BAŞARILI! '{persona_name}' hafızası başarıyla Buluta (Pinecone) yüklendi!")
    print("Artık Vercel/Next.js uygulaması üzerinden sohbete başlayabilirsiniz.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("persona", type=str)
    args = parser.parse_args()
    main(args.persona)