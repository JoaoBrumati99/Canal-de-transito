# Canal de Trânsito Seguro — Frontend

Frontend React/Vite do Canal de Trânsito Seguro.

## Executar localmente

```sh
npm install
npm run dev
```

Com `VITE_API_BASE_URL` vazio, as chamadas `/api` usam o proxy local do Vite
para `http://localhost:3001`.

## Publicar na Vercel

Configure o Root Directory do projeto frontend como
`Canal-de-transito-amalfis-front-main`. Defina `VITE_API_BASE_URL` nas
Environment Variables da Vercel com a URL pública do projeto backend Express,
sem barra no final, e faça um novo deploy do frontend.

Os anexos são limitados a 4 MB no total por envio e são encaminhados por e-mail;
o aplicativo não os mantém em armazenamento persistente.
