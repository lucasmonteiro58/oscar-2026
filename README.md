# Bolão Oscar 2026

Site mobile-first para bolão do Oscar 2026: login com Google, votação por categoria, área admin para marcar vencedores e ranking final.

## Stack

- React (Vite) + Tailwind CSS + React Router
- Firebase (Authentication com Google, Firestore)

## Requisitos

- Node.js 20.19+ ou 22.12+ (recomendado para Vite 8)

## Setup

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um projeto no [Firebase Console](https://console.firebase.google.com) e ative:
   - **Authentication** → Sign-in method → Google
   - **Firestore Database** → criar banco

3. Copie as variáveis de ambiente e preencha com as credenciais do Firebase:
   ```bash
   cp .env.example .env
   ```
   **Como preencher o `.env` (passo a passo):**
   - Acesse o [Firebase Console](https://console.firebase.google.com) e abra seu projeto (ou crie um novo).
   - Clique no ícone de **engrenagem** ao lado de "Visão geral do projeto" e escolha **Configurações do projeto**.
   - Na aba **Geral**, role até a seção **Seus aplicativos**.
   - Se ainda não tiver um app web: clique em **</>** (ícone da Web), dê um nome (ex: "Bolão Oscar"), não marque Firebase Hosting por enquanto e clique em **Registrar app**.
   - Na tela que aparece, você verá um objeto `firebaseConfig` com as chaves. Copie cada valor para o `.env` assim:
     - `apiKey` → `VITE_FIREBASE_API_KEY=`
     - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN=`
     - `projectId` → `VITE_FIREBASE_PROJECT_ID=`
     - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET=`
     - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID=`
     - `appId` → `VITE_FIREBASE_APP_ID=`
   - Salve o arquivo `.env` na raiz do projeto (ele não deve ser commitado).

4. No Firebase Console, em Firestore → Regras, cole o conteúdo de `firestore.rules` (ou ajuste conforme sua segurança).

5. Rode o projeto:
   ```bash
   npm run dev
   ```

## Rotas

- `/` — Login (Google) ou, se logado, Minhas apostas (ou redireciona para `/votar`)
- `/votar` — Wizard de votação (uma categoria por tela)
- `/resultado` — Ranking geral (quando o resultado estiver publicado)
- `/admin` — Área restrita por senha (91501748) para marcar os vencedores oficiais

## Dados

As categorias e indicados vêm de `public/oscar.json`. Você pode editar esse arquivo para incluir fotos nos indicados (campo `photo` com URL).
