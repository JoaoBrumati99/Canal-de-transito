# Preflight de politica e privacidade: Nominatim publico

**Data da verificacao:** 2026-11-25  
**Decisao:** **NO-GO para chamadas diretas do navegador ao Nominatim publico.** Nao iniciar a implementacao com essa arquitetura.

## Conclusao executiva

A politica atual permite consultas disparadas diretamente pelo usuario em aplicacoes com volume moderado, mas exige que o trafego total de todos os usuarios da aplicacao nao ultrapasse uma requisicao por segundo. Um frontend isolado nao tem uma visao ou coordenacao confiavel entre usuarios, dispositivos e sessoes para garantir esse limite agregado. Portanto, o fluxo nao pode ser aprovado como frontend-only.

Ha tambem um bloqueio de privacidade independente: o Nominatim publico pede que nao sejam enviados dados pessoais ou confidenciais. Coordenadas precisas da localizacao atual podem revelar residencia ou deslocamento e, associadas a um pedido identificavel, podem ser dados pessoais. A politica nao esclarece especificamente se coordenadas precisas de usuarios sao aceitas, nem a politica de privacidade consultada especifica por quanto tempo os parametros de reverse geocoding sao retidos. Consentimento no formulario e um aviso previo sao salvaguardas importantes, mas nao resolvem por si so a restricao do servico.

## Requisitos oficiais encontrados

Fonte decisoria principal: [Nominatim Usage Policy (aka Geocoding Policy)](https://operations.osmfoundation.org/policies/nominatim/), consultada em 2026-11-25.

- **Limite:** no maximo absoluto de uma requisicao por segundo. O limite se aplica por website/aplicacao; o total das requisicoes de todos os usuarios nao pode excede-lo.
- **Identificacao:** fornecer `HTTP Referer` ou `User-Agent` valido que identifique a aplicacao. User-Agent padrao de bibliotecas nao e suficiente.
- **Uso interativo:** consultas diretamente acionadas pelo usuario sao aceitas se o numero de usuarios for moderado. Isso nao remove o limite agregado.
- **Atribuicao:** exibir atribuicao apropriada.
- **Troca de servico:** a aplicacao deve poder trocar de servico a pedido da OSMF, sem exigir atualizacao do software.
- **Proxy/cache:** a politica recomenda configurar um proxy e habilitar cache, se possivel.
- **Usos vedados ou desaconselhados:** autocomplete e consultas sistematicas sao proibidos; geocodificacao em massa e desaconselhada e sujeita a restricoes adicionais.
- **Dados e privacidade:** os dados sao fornecidos sob ODbL; a politica de uso tambem diz para nao enviar dados pessoais ou outro material confidencial aos servicos OSMF. A politica pode mudar sem aviso.

Fonte oficial adicional: [OSMF Privacy Policy](https://osmfoundation.org/wiki/Privacy_Policy), consultada em 2026-11-25. Ela inclui o Nominatim entre os servicos OSMF e informa que os registros de acesso podem conter IP, tipo de navegador/dispositivo, sistema operacional, pagina referenciadora, horario e paginas acessadas. Tambem descreve o uso de registros para operacao, seguranca, analise agregada e melhoria dos dados, inclusive analise de consultas Nominatim para enderecos e codigos postais ausentes. A pagina informa retencao de 180 dias para informacoes detalhadas de uso do Piwik, mas nao fixa nesse trecho um prazo geral para logs ou parametros de reverse geocoding. Assim, nao se deve inferir que coordenadas da consulta nao sao registradas ou que tenham um prazo de retencao especifico.

Os [OSMF Services Terms of Use](https://osmfoundation.org/wiki/Terms_of_Use), consultados em 2026-11-25, incorporam as politicas de uso da OSMF e responsabilizam quem usa os servicos, inclusive por uso permitido por seus usuarios finais. A politica do Nominatim aponta para a [licenca ODbL](https://www.openstreetmap.org/copyright) e para as diretrizes oficiais de atribuicao. Os resultados usados no produto devem manter atribuicao adequada e o tratamento de extracoes deve respeitar a licenca.

## Avaliacao da arquitetura

### Identificacao do navegador

O User-Agent normal do navegador nao e uma identificacao especifica da aplicacao. Uma chamada direta poderia depender do `Referer` enviado pelo navegador para identificar o site, mas o frontend nao pode definir livremente o cabecalho `Referer`; politicas de referrer, contexto de hospedagem e configuracoes de privacidade podem altera-lo ou omiti-lo. Mesmo que a origem publica do site seja enviada e suficiente para identificar a aplicacao, isso nao resolve o limite agregado nem a questao de privacidade.

### Limite agregado

Um controle no cliente pode limitar chamadas em uma instancia local, mas nao coordenar de forma confiavel navegadores, usuarios e dispositivos diferentes. Sem um componente compartilhado, nao ha mecanismo para aplicar um limitador global de uma requisicao por segundo para toda a aplicacao. Logo, chamadas diretas do frontend nao demonstram conformidade com o requisito agregado.

### Coordenadas precisas

Uma consulta reversa precisa transmitir latitude e longitude ao operador do servico. A documentacao oficial consultada nao afirma que coordenadas precisas sejam sempre ou automaticamente dados pessoais, nem esclarece uma excecao para localizacao atual com consentimento. Entretanto, a precisao pode expor um local privado e, em contexto associado a usuario, IP ou formulario, identificar ou revelar informacoes sobre uma pessoa. Dada a instrucao oficial de nao enviar dados pessoais/confidenciais e a falta de esclarecimento explicito, a decisao conservadora e nao transmitir essas coordenadas ao servico publico ate a aplicabilidade ser resolvida.

## Condicoes para prosseguir

1. **Nao aprovar frontend direto ao Nominatim publico.**
2. Se o Nominatim publico continuar em avaliacao, adotar um proxy/backend compartilhado que aplique limite global (fila ou token bucket), cache quando viavel e roteamento configuravel para trocar de provedor sem atualizacao do frontend. O proxy deve identificar a aplicacao de forma valida e aceitar apenas consultas interativas necessarias; nao implementar autocomplete, consultas sistematicas ou retries automaticos.
3. Antes de transmitir coordenadas precisas, obter esclarecimento oficial da OSMF sobre a aceitabilidade desse dado no caso de uso, ou escolher um provedor cujos termos e garantias de privacidade permitam explicitamente esse processamento. O proxy, por si so, nao remove o dado da requisicao ao Nominatim.
4. Alternativas: hospedar uma instancia propria de Nominatim (a politica do servico publico declara que nao se aplica a servicos operados por outras organizacoes; ainda sera necessario avaliar privacidade, seguranca, custos e ODbL), ou selecionar um provedor de geocodificacao com termos adequados a localizacao precisa. Se nao houver resposta satisfatoria para a questao de privacidade, bloquear o uso de Nominatim publico.
5. Se um provedor for aprovado, preservar consentimento explicito antes da geolocalizacao/transmissao, informar o destinatario e o dado enviado, manter atribuicao OSM quando dados OSM forem exibidos e documentar a rota e limites aprovados.

## Resultado do gate

**Bloqueado ate decisao de arquitetura e privacidade.** A possibilidade de chamadas interativas e de identificacao por `Referer` nao supera a impossibilidade de garantir o limite agregado no frontend nem esclarece se a localizacao precisa pode ser enviada sob a politica de privacidade. Atualizar e revalidar as fontes oficiais antes de qualquer implementacao, pois a politica pode mudar sem aviso.

Nenhuma chamada a API com coordenadas foi feita para este preflight.
