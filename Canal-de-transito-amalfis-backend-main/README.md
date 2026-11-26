# Canal de Trânsito Seguro — Backend

Express API for the Canal de Trânsito Seguro application.

## Publish on Vercel

Create a second Vercel project connected to this repository and set its Root
Directory to `Canal-de-transito-amalfis-backend-main`. Vercel detects the
Express app exported by `server.js` and deploys it as a Node.js Function.

Add these Environment Variables to the backend Vercel project:

- `MAILERSEND_API_TOKEN`
- `EMAIL_FROM`
- `RECEBEEMAIL`
- `EMAIL_COPIA` (optional)
- `FRONTEND_ORIGIN` (for example, `https://canal-de-transito-amalfis.vercel.app`, without a trailing slash)
- `GEOAPIFY_ENABLED` (`true` only when the integration is approved and configured)
- `GEOAPIFY_API_KEY`
- `GEOAPIFY_RATE_LIMIT_PER_MINUTE` (optional; defaults to `10`)
- `GEOAPIFY_MAX_CONCURRENT` (optional; defaults to `2`)

After the backend's first deployment, set `VITE_API_BASE_URL` in the frontend
Vercel project's Environment Variables to the backend deployment URL and
redeploy the frontend. Never expose API keys in the frontend project.

Attachments are held in memory only while the email is being sent. The total
attachment size is limited to 4 MB per submission; the application does not
persist uploaded files.

For local development, create `.env` from `.env.example` and run:

```sh
npm install
npm run dev
```

## Configurar e testar o e-mail

Copie `.env.example` para `.env` e configure `MAILERSEND_API_TOKEN` com um
token de API do MailerSend. O backend usa o Email API (`POST /v1/email`), não
as credenciais SMTP. O remetente em `EMAIL_FROM` deve usar um domínio
verificado na conta MailerSend. Mantenha o token apenas no `.env` local.

Preencha `EMAIL_TEST_TO` com o endereço que deve receber o teste e execute na
pasta do backend:

```sh
npm run email:test
```

O envio das denúncias utiliza `RECEBEEMAIL` como destinatário. A API retorna
HTTP 202 quando aceita a mensagem para processamento; isso não garante que o
destinatário a recebeu, então confira a atividade e os bounces no MailerSend.
O formulário envia os dados da ocorrência e os anexos para o backend; a
mensagem só retorna sucesso depois que o MailerSend aceita o envio.

## Configurar a sugestão de endereço Geoapify

Copie `.env.example` para `.env` e coloque a chave da Reverse Geocoding API em
`GEOAPIFY_API_KEY`. A chave é lida somente pelo backend; não a coloque no
frontend nem em arquivos versionados. `GEOAPIFY_ENABLED` permanece `false` por
padrão. A API só é chamada quando o backend está habilitado e uma chave válida
está configurada.

Ao habilitar a integração, o backend encaminha as coordenadas autorizadas pelo
usuário à Geoapify. O formulário deve informar isso antes de pedir localização.
As respostas são reduzidas a rua, bairro, cidade e CEP disponíveis, sem
inventar componentes ausentes. O plano gratuito informa até 3.000 créditos por
dia; confira os limites atuais da sua conta e inclua a atribuição exigida pela
Geoapify antes de usar em produção.
