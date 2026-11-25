# API

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
