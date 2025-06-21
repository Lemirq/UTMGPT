# UTM-GPT

UTM-GPT is a full-stack AI-powered chatbot designed to answer questions about the University of Toronto Mississauga (UTM). It uses a Retrieval-Augmented Generation (RAG) pipeline to provide accurate and contextually relevant answers based on information scraped from the UTM website.

## ✨ Features

- **Comprehensive Knowledge Base**: The chatbot's knowledge is built upon a vast collection of documents scraped from the UTM website and related academic calendars.
- **AI-Powered Chat Interface**: A user-friendly, responsive chat interface built with Next.js and Tailwind CSS for seamless interaction.
- **Intelligent Search**: Leverages vector embeddings and semantic search to find the most relevant information to answer user queries.
- **Extensible & Scalable**: The architecture is modular, allowing for easy expansion of the knowledge base and integration of new features.

## 🏛️ Architecture

The project consists of two main components: a Python-based web scraper and a Next.js chat application.

```mermaid
graph TD
    subgraph gpt-scraper
        A[UTM Website] --> B(Crawler);
        B --> C{Raw HTML};
        C --> D[Parser];
        D --> E{Cleaned Text};
        E --> F[Chunker];
        F --> G{Text Chunks};
        G --> H[Embedding Model];
        H --> I{Vector Embeddings};
    end

    subgraph "Vector DB"
        I --> J[(Supabase PGVector)];
    end

    subgraph utmgpt-chat
        K[User Query] --> L{Chat API};
        L --> M[Embedding Model];
        M --> N{Query Embedding};
        N --> J;
        J --> O{Relevant Chunks};
        O --> L;
        L --> P[LLM];
        P --> Q[Answer];
        Q --> R(Chat UI);
    end

    style gpt-scraper fill:#f9f9f9,stroke:#333,stroke-width:2px
    style "Vector DB" fill:#f9f9f9,stroke:#333,stroke-width:2px
    style utmgpt-chat fill:#f9f9f9,stroke:#333,stroke-width:2px
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [Python](https://www.python.org/downloads/) (v3.12 or later)
- [Bun](https://bun.sh/)
- A Supabase account for vector storage.

### Environment Variables

You'll need to set up environment variables for both the scraper and the chat application.

**For `gpt-scraper`**: Create a `.env` file in the `gpt-scraper` directory:

```
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

**For `utmgpt-chat`**: Create a `.env.local` file in the `utmgpt-chat` directory:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# AI Models (choose one or more)
# OpenAI
OPENAI_API_KEY="sk-..."

# Google Generative AI
GOOGLE_API_KEY="..."

```

## 🐍 `gpt-scraper`

The `gpt-scraper` is a collection of Python scripts responsible for crawling, parsing, embedding, and uploading data to the vector database.

### Setup and Running

1.  **Navigate to the scraper directory**:

    ```bash
    cd gpt-scraper
    ```

2.  **Create a virtual environment and install dependencies**:
    It is recommended to use a virtual environment manager like `uv` or `venv`.

    ```bash
    # Using uv
    uv venv
    uv pip install -r requirements.txt

    # Or using venv
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

    _Note: A `requirements.txt` file is not provided. Based on the scripts, you will need the following dependencies:_

    ```
    beautifulsoup4
    python-dotenv
    requests
    sentence-transformers
    supabase
    ```

    You can create a `requirements.txt` file with these dependencies.

3.  **Run the crawler**:
    This will start crawling from the base UTM URL and save the pages as text files.

    ```bash
    python utm-crawler.py
    ```

4.  **Embed and upload the data**:
    After crawling, this script will process the saved text files, create embeddings, and upload them to your Supabase database.
    ```bash
    python utm_embed_and_upload.py
    ```

## 💬 `utmgpt-chat`

The `utmgpt-chat` is a Next.js application that provides the chat interface.

### Setup and Running

1.  **Navigate to the chat app directory**:

    ```bash
    cd utmgpt-chat
    ```

2.  **Install dependencies**:

    ```bash
    bun install
    ```

3.  **Run the development server**:

    ```bash
    bun run dev
    ```

    The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```
.
├── gpt-scraper/            # Python scripts for data scraping and processing
│   ├── utm-crawler.py
│   ├── utm_embed_and_upload.py
│   └── ...
├── utmgpt-chat/            # Next.js chat application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
└── README.md
```
