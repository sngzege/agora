import os
import argparse
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

CHROMA_PATH = "./chroma_db"
DOCS_PATH = "./docs"

# Eğer klasörde özel bir prompt yoksa kullanılacak varsayılan iskelet
DEFAULT_SYSTEM_PROMPT = """Sen bilge bir kütüphanecisin. 
Aşağıdaki kaynak metinleri kullanarak kullanıcıyı felsefi ve tarihi konularda aydınlat.
Kullanıcıya derin, saygılı ve akademik bir dille cevap ver. 
SADECE aşağıdaki kaynak metinlerden yola çıkarak konuş.

KAYNAK METİNLER:
{context}

KULLANICI SORUSU: {question}

BİLGE KÜTÜPHANECİ:"""

def load_persona_prompt(persona_name):
    # Eğer docs/persona_adı/prompt.txt dosyası varsa onu yükler
    prompt_file = os.path.join(DOCS_PATH, persona_name, "prompt.txt")
    if os.path.exists(prompt_file):
        with open(prompt_file, 'r', encoding='utf-8') as f:
            return f.read().strip()
    
    # Yoksa hardcoded bazı popüler olanları dene (Fallback)
    popular_prompts = {
        "jung": "Sen İsviçreli Psikiyatr Carl Jung'sun. Analitik psikoloji ve arketipler konusunda uzmansın. Kendinden 'ben' diye bahset. Kaynaklara sadık kal.\n\nKAYNAK:\n{context}\n\nSORU: {question}\n\nJUNG:",
        "sokrates": "Sen Atinalı Sokrates'sin. Sokratik İroni ile sorular sorarak insanları düşündürürsün. Kaynakları temel al.\n\nKAYNAK:\n{context}\n\nSORU: {question}\n\nSOKRATES:",
        "schopenhauer": "Sen Arthur Schopenhauer'sin. Hayatı 'İrade' ve acı üzerinden yorumlayan kötümser bir filozofsun. Kaynaklara sadık kal.\n\nKAYNAK:\n{context}\n\nSORU: {question}\n\nSCHOPENHAUER:",
        "spinoza": "Sen Baruch Spinoza'sın. Her şeyi Tanrı/Doğa zorunluluğuyla, geometrik bir kesinlikle açıklarsın. Kaynaklara sadık kal.\n\nKAYNAK:\n{context}\n\nSORU: {question}\n\nSPINOZA:"
    }
    return popular_prompts.get(persona_name.lower(), DEFAULT_SYSTEM_PROMPT)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def main(persona_name):
    os.system('cls' if os.name == 'nt' else 'clear')
    print("==================================================")
    print(f"🏛️  HERMETİK DİJİTAL KÜTÜPHANE: {persona_name.upper()}")
    print("==================================================\n")

    print("[1/3] Semantik modeller yükleniyor...")
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    
    print(f"[2/3] '{persona_name}' hafızasına bağlanılıyor...")
    if not os.path.exists(CHROMA_PATH):
        print("\n[HATA] Veritabanı bulunamadı. Lütfen önce 'python ingest.py <isim>' çalıştırın.")
        return
        
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_model, collection_name=persona_name)
    retriever = db.as_retriever(search_kwargs={"k": 5}) # En alakalı 5 parça
    
    print("[3/3] Ollama Llama-3 motoruna bağlanılıyor...")
    try:
        llm = Ollama(model="llama3")  
    except Exception as e:
        print("\n[HATA] Ollama (Llama-3) servisi açık değil.")
        return

    # Dinamik Prompt Yükleme
    system_prompt = load_persona_prompt(persona_name)
    prompt = PromptTemplate.from_template(system_prompt)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"==================================================")
    print(f"🏛️  {persona_name.upper()} İLE SOHBET BAŞLADI")
    print("Çıkış için 'q' yazın.")
    print(f"==================================================\n")

    while True:
        try:
            query = input("Sen: ")
            if query.lower() in ['q', 'çıkış', 'quit']: break
            if not query.strip(): continue
            
            print(f"\n[{persona_name.capitalize()} yazıyor...]")
            for chunk in rag_chain.stream(query):
                print(chunk, end="", flush=True)
            print("\n\n" + "-"*40 + "\n")
            
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("persona", type=str)
    args = parser.parse_args()
    main(args.persona)
