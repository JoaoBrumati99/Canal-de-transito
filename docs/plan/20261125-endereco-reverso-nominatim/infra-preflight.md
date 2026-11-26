# Preflight de infraestrutura: quota Google e controles de IP

Data da verificacao: 2026-11-25

## Conclusao executiva

- A documentacao oficial do Google Maps Platform descreve quota diaria como limite rigido: e possivel reduzir a quota por dia; ao atingir o limite, novas requisicoes a API falham ate a renovacao diaria, a meia-noite do horario do Pacifico. Portanto, uma meta de 15 requisicoes/dia e compativel com o mecanismo documentado de quota diaria.
- A documentacao publica nao confirma qual quota diaria esta atualmente disponivel ou configurada no projeto Google deste sistema. A existencia da linha de quota diaria para Geocoding e a possibilidade de salva-la com o valor 15 precisam ser verificadas na pagina de Quotas do projeto correto. Nenhuma configuracao ativa foi presumida.
- Os manifests versionados mostram um servico de backend no Docker Compose, sem replicas/escala declaradas. O Compose usa uma rede externa chamada `webproxy`, mas nao versiona a configuracao do proxy. Tambem nao foi encontrado rate limiter, configuracao `trust proxy` do Express ou politica de CORS restritiva.
- E possivel preparar e testar a implementacao sem liberar trafego real: manter o endpoint fechado quando a chave estiver ausente e testar esse caminho sem chamadas externas. A liberacao de trafego deve permanecer bloqueada ate a verificacao operacional da quota, da chave/restricoes e do proxy/IP confiavel no ambiente implantado.

## Google Cloud: quotas e faturamento

Fontes oficiais consultadas:

1. [Geocoding API: Usage and Billing](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)
   - Exige billing habilitado e chave API ou OAuth nas requisicoes.
   - Informa que quotas diarias sao renovadas a meia-noite do horario do Pacifico.
   - Orienta modificar quotas em Google Maps Platform > Quotas e descreve que o servico deixa de responder quando a quota definida e atingida.
2. [Google Maps Platform: Manage costs](https://developers.google.com/maps/billing-and-pricing/manage-costs)
   - Descreve a quota por dia como limite rigido: reduzir a quota diaria limita as requisicoes; ao atingir o valor, as requisicoes falham pelo restante do dia e o limite renova a meia-noite do horario do Pacifico.
   - Instrui alterar o limite na pagina Quotas do Cloud Console. A documentacao usa quotas diarias em requisicoes/dia como exemplo e recomenda configurar o limite no contador correspondente ao faturamento do SKU.
   - Informa que requisicoes bem-sucedidas e requisicoes com erro de servidor contam para quota; falhas de autenticacao nao contam.
   - Adverte que pode haver diferencas entre metrica de quota e faturamento por separacao tecnica entre os sistemas. Quota e um teto de uso, nao substitui restricoes de chave ou monitoramento de faturamento.
3. [Google Cloud: View and manage quotas](https://cloud.google.com/docs/quotas/view-manage)
   - Confirma que quotas de taxa podem ter granularidade por minuto, por 100 segundos ou por dia; ajustes dependem do produto e de permissoes IAM.

**Resposta sobre 15/dia:** a documentacao oficial sustenta que quotas diarias podem ser reduzidas para limitar uso, e que o Google Maps Platform permite editar quotas de uma API. Isso torna o limite de 15/dia coerente com o mecanismo documentado. Porem, confirmar que o projeto alvo de Geocoding apresenta a quota diaria editavel e aceitar o valor 15 requer consultar o item especifico na pagina Quotas desse projeto. Isso nao pode ser determinado apenas por documentacao publica ou pelos arquivos versionados.

O custo efetivo tambem depende do uso faturavel agregado do projeto e da faixa gratuita aplicavel no periodo; o limite de quota nao garante custo zero. O Cloud Billing Dashboard e a fonte de faturamento final e pode ter atraso de ate 48 horas, conforme a documentacao de gestao de custos.

## Evidencia versionada de backend e deployment

- `Canal-de-transito-amalfis-deploy-main/docker-compose.yml`: declara um servico `denuncia-amalfis-backend` expondo internamente a porta 3001, sem `deploy.replicas` ou outra declaracao de escala. Declara tambem a rede externa `webproxy`; nao inclui configuracao do proxy, regras de encaminhamento ou cabecalhos de IP.
- `Canal-de-transito-amalfis-deploy-main/.github/workflows/deploy.yml`: o deploy remoto executa `docker compose up -d`; o workflow nao define escala de replicas.
- `Canal-de-transito-amalfis-backend-main/package.json`: inclui Express e `cors`, mas nao inclui dependencia de rate limit.
- `Canal-de-transito-amalfis-backend-main/app/routes/index.js`: instala `cors()` sem opcoes de restricao. CORS nao e controle antiabuso e nao limita chamadas de clientes nao-browser.
- `Canal-de-transito-amalfis-backend-main/app/app.js` e `server.js`: nao configuram `trust proxy`; o servidor escuta na porta 3001.
- Busca no backend e nos manifests de deploy por rate limit, `trust proxy`, `X-Forwarded-For`, `remote_addr`, proxy upstream e replicas nao encontrou configuracao correspondente. Arquivos de proxy/provedor podem existir fora do repositorio e nao foram inspecionados.

## Confirmavel versus pendente

**Confirmavel pelo repositorio:** declaracao de um servico backend no Compose, ausencia de escala declarada nesses manifests, rede externa `webproxy`, ausencia de configuracao de proxy versionada nesses arquivos, CORS generico e ausencia de rate limiter/configuracao Express `trust proxy` no escopo pesquisado.

**Nao confirmavel pelo repositorio:** numero real de containers em execucao, quantidade de hosts ou replicas mantidos pelo provedor, terminacao e encaminhamento do proxy, se `X-Forwarded-For` e sanitizado/confiavel, IP que chega ao Express, regras de firewall e qualquer rate limit configurado externamente. Tambem nao sao confirmaveis a quota ativa no Google Cloud, a chave selecionada, suas restricoes, billing ou consumo atual.

**Gate operacional, sem solicitar credenciais neste preflight:** antes de ativar chamadas reais, um operador autorizado deve confirmar no projeto correto que Geocoding esta habilitada, que a quota diaria correspondente foi configurada para no maximo 15 requisicoes/dia, que as restricoes da chave sao apropriadas e que o billing/alertas foram revistos. Deve tambem confirmar com o provedor qual proxy e confiavel, quais cabecalhos/IPs chegam ao backend e a escala efetiva; o limitador por IP no codigo nao deve confiar em cabecalhos encaminhados sem essa configuracao.

## Decisao para implementacao segura

Pode-se prosseguir com implementacao e testes sem abrir trafego real, desde que a ausencia da chave mantenha o endpoint fail-closed antes de qualquer chamada ao Google, os testes verifiquem explicitamente esse comportamento sem rede externa e a ativacao de chamadas fique condicionada ao gate operacional acima. Este preflight nao alterou codigo, nao consultou sistemas autenticados e nao fez requisicoes a Geocoding API.
