# Preflight de viabilidade de deployment: Nominatim publico

Data: 2026-11-26
Decisao: NO-GO para chamadas reais ao Nominatim publico.

## Escopo e limites

Inspecionei somente arquivos rastreados pelo Git nos diretorios de deploy,
backend e frontend, incluindo o conteudo atual dos arquivos rastreados que estao
modificados na arvore de trabalho. Consultei os documentos de preflight ja
existentes neste plano para as fontes oficiais de politica que eles citam.

Nao fiz requisicoes HTTP, nao enviei coordenadas, nao acessei provedor,
dashboard, credenciais ou sistemas autenticados e nao alterei codigo nem
configuracao operacional. Nao inspecionei o conteudo dos arquivos nao
rastreados. Em particular, `app/routes/geocodeRoutes.js`,
`geocodebr-service/` e `src/TransitoForm/reverseGeocode.js` aparecem como nao
rastreados; seus comportamentos nao podem ser confirmados neste preflight.

## Caminho de configuracao e release observado

- `Canal-de-transito-amalfis-deploy-main/docker-compose.yml` e o Compose
  versionado de deploy. O servico backend recebe `./.back.env` (arquivo ausente
  do inventario rastreado), conecta-se a rede externa `webproxy` e a rede
  `geocodebr-internal`. O Compose tambem injeta
  `GEOCODEBR_SERVICE_URL`, `GEOCODEBR_RATE_LIMIT_PER_MINUTE` (padrao 10) e
  `GEOCODEBR_MAX_CONCURRENT` (padrao 2).
- O mesmo Compose define o servico `geocodebr`, com
  `GEOCODEBR_ENABLED: ${GEOCODEBR_ENABLED:-false}`, diretorio de cache
  `/var/cache/geocodebr` e volume nomeado `geocodebr-data`. O contexto de build
  indicado (`../Canal-de-transito-amalfis-backend-main/geocodebr-service`) nao
  esta rastreado. Esse gate nomeado e default-off para GeocodeBR; nao e evidencia
  de um gate Nominatim.
- O Compose nao declara `deploy.replicas`, escala ou outro limite de processos.
  Uma definicao de servico sem escala declarada nao demonstra que haja uma unica
  replica em execucao.
- `Canal-de-transito-amalfis-backend-main/.github/workflows/deploy.yml` roda em
  push para `main`, cria e envia a imagem para ECR e faz deploy por SSH. O script
  executa `docker compose down`, baixa a imagem e executa `docker compose up -d`.
- `Canal-de-transito-amalfis-deploy-main/.github/workflows/deploy.yml` tambem
  roda em push para `main`, e executa `docker compose down` seguido de
  `docker compose up -d --build` no servidor. O workflow do frontend tambem
  constroi/envia imagem para ECR e faz deploy por SSH em push para `main`.
- Nenhum desses workflows versionados mostra ambientes separados dev/test/stage,
  aprovadores de ambiente, gate de privacidade antes do deploy, smoke test ou
  verificacao de saude antes/depois do deploy. Regras de branch, protecao de
  secrets e configuracoes externas nao sao inferidas a partir do repositorio.
- `Canal-de-transito-amalfis-front-main/vite.config.js` encaminha `/api` para
  `http://localhost:3001` no servidor Vite. Isso identifica somente o proxy de
  desenvolvimento, nao um proxy Nominatim de producao. `server.js` sobe o
  Express na porta 3001. O Compose expoe as portas 3000/3001 na rede `webproxy`,
  mas os arquivos de configuracao do proxy externo nao estao versionados.

## Gates de ambiente e possibilidade de chamada

Nao encontrei mecanismo versionado e protegido que condicione chamadas reais a
dev, test, stage ou prod. O Compose tem uma variavel default-off especifica de
GeocodeBR, mas nao tem uma variavel ou politica Nominatim equivalente. Tambem
nao existe gate de aprovacao por ambiente nos workflows rastreados.

O Compose aceita variaveis de ambiente e um `env_file` externo ao repositorio.
Assim, os manifests nao impedem um operador com acesso ao ambiente de definir
variaveis. Entretanto, nao e possivel afirmar, com os arquivos permitidos neste
preflight, que qualquer valor de ambiente efetivamente ativa ou chama uma rota
Nominatim: o modulo importado `app/routes/geocodeRoutes.js` e o cliente
frontend `src/TransitoForm/reverseGeocode.js` nao estao rastreados e nao foram
inspecionados. A ausencia de gate versionado nao deve ser confundida com prova
do comportamento do codigo nao rastreado. O mecanismo de deploy versionado nao
separa nem protege ambientes antes de aplicar essas configuracoes.

## Limite agregado, cache e saida de rede

- Nao ha no Compose ou workflows um limitador global compartilhado, fila
  distribuida ou servico de coordenacao cuja configuracao assegure no maximo
  uma requisicao por segundo agregada entre processos e replicas.
- Os valores `GEOCODEBR_RATE_LIMIT_PER_MINUTE=10` e
  `GEOCODEBR_MAX_CONCURRENT=2` referem-se nominalmente ao caminho GeocodeBR.
  Eles nao definem o limite Nominatim de uma requisicao/segundo. A
  implementacao que poderia aplicar esses valores nao esta rastreada, portanto
  nao classifico o limitador como global nem afirmo que seja em memoria local.
- O volume nomeado `geocodebr-data` persiste o diretorio de cache do servico
  GeocodeBR no host Compose. Nao ha configuracao versionada de cache
  Nominatim nem evidencia de armazenamento compartilhado entre hosts ou
  replicas. Um volume local nao prova cache distribuido.
- A rede `geocodebr-internal` esta marcada `internal: true`, mas o backend
  tambem se conecta a rede externa `webproxy`. Os manifestos nao configuram
  firewall, egress policy ou proxy de saida para o backend; a configuracao
  efetiva da rede `webproxy` e externa e desconhecida. Nao se pode concluir que
  chamadas externas estejam bloqueadas ou permitidas em runtime.
- Nao ha configuracao versionada de quantidade de hosts ou replicas. Numero
  real de processos, regras de proxy, IP de saida, regras de firewall,
  variaveis implantadas e compartilhamento de estado exigem verificacao por
  operador com acesso ao ambiente. Este preflight nao tenta essa verificacao.

## Privacy gate e fontes existentes

Nenhum documento de aprovacao de privacidade/juridico esta presente nos arquivos
do repositorio inspecionados nem foi fornecido nesta conversa. A selecao do
Nominatim publico e o consentimento do usuario para o fluxo nao constituem
aprovacao de elegibilidade da politica para transmitir coordenadas precisas.
Nao inventei nem presumi essa aprovacao.

O documento
`docs/plan/20261125-endereco-reverso-nominatim/preflight.md` ja cita a politica
oficial [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
e resume o limite absoluto de uma requisicao por segundo agregado por website/
aplicacao, requisito de identificacao, uso interativo, atribuicao, cache/proxy
recomendado e instrucao para nao enviar dados pessoais ou confidenciais. Esse
mesmo documento registra a incerteza especifica sobre coordenadas precisas e
que consentimento nao elimina essa lacuna. A
[OSMF Privacy Policy](https://osmfoundation.org/wiki/Privacy_Policy) e os
[OSMF Services Terms of Use](https://osmfoundation.org/wiki/Terms_of_Use)
tambem ja estao referenciados ali. Nao consultei novamente os sites durante
este preflight.

## Viabilidade de testes sem trafego real

E viavel implementar testes exclusivamente mockados sem qualquer caminho de
saida ao Nominatim: o cliente externo pode ser substituido por um mock e os
testes podem falhar se houver tentativa de rede. Isso e uma possibilidade de
implementacao, nao um comportamento atualmente comprovado pelos arquivos
rastreados. Nenhum trabalho aqui habilitou uma chamada real. Todas as chamadas
reais devem permanecer desabilitadas ate que o codigo e o controle de
egress/limite sejam verificaveis e o gate de privacidade seja autorizado.

## Resultado

**NO-GO para Nominatim real.** Motivos independentes: nao ha aprovacao de
privacidade fornecida; nao ha gate Nominatim versionado/protegido por ambiente;
nao ha prova de um limite global compartilhado de <= 1 requisicao/segundo; a
escala e o proxy/egress reais nao podem ser determinados pelos manifestos; e a
implementacao relevante das rotas/clientes nao esta rastreada. O status
default-off de GeocodeBR nao altera esta decisao.

Antes de qualquer avaliacao futura de ativacao, o operador deve fornecer a
evidencia de aprovacao aplicavel e validar no ambiente efetivo a escala, proxy,
egress e coordenacao de limite/estado. O codigo de rota e cliente deve estar
rastreado e revisavel; nenhum desses passos foi realizado aqui.
