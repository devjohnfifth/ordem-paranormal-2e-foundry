# Ordem Paranormal RPG 2 — Playtest (Foundry VTT)

> ⚠️ **Este é o branch `dev` — versão de desenvolvimento, instável.** É onde o trabalho
> em andamento acontece; pode quebrar a qualquer commit. A versão **estável**, a que é
> compartilhada publicamente pra outras pessoas instalarem, fica congelada no branch
> [`master`](https://github.com/devjohnfifth/ordem-paranormal-2e-foundry/tree/master) e
> só recebe atualizações quando o trabalho daqui é promovido pra lá.

Sistema **não-oficial** para Foundry VTT, feito para uso pessoal de mesa, baseado no
primeiro Playtest Alpha de **Ordem Paranormal RPG 2** (Rafael "Cellbit" Lange / Jambô Editora),
lançado no Pacote #8 dos Arquivos Secretos (agosto/2026).

> Ordem Paranormal 2 ainda está em desenvolvimento. Este playtest cobre apenas atributos,
> perícias, perfis psicológicos, testes, cenas de investigação, desafios de acesso e uma
> versão simplificada de ferimentos/traumas/combate. Regras de rituais, poderes, NEX e
> combate completo ainda não foram publicadas — os campos existem na ficha, mas ficam
> em aberto até um próximo pacote trazer as regras oficiais.

Compatível com **Foundry VTT v13+** (testado ao vivo em v14.365 — verifique o número exato
da sua instalação).

> O sistema só tem conteúdo em português. Se a interface do **Foundry em si** (menus,
> botões como "Search"/"Create") aparecer em inglês, isso é uma configuração global do
> Foundry, não deste sistema — mude em *Configuração* (ícone de engrenagem na tela de
> Setup, ou dentro do mundo em *Configurar Configurações* → *Idioma*) para
> **Português (Brasil)**.

## Instalação

> O repositório voltou a ser **público** — sem fins comerciais, só pra facilitar a
> instalação por link de manifesto. Veja o aviso de direitos autorais no fim deste
> arquivo: o conteúdo do Ato II (exclusivo dos assinantes dos Arquivos Secretos) ainda
> não foi incluído por causa disso.

**Opção A — pela tela de instalação do Foundry (mais fácil):**

1. Na tela de Setup do Foundry, vá em **Sistemas de Jogo** → **Instalar Sistema**.
2. Cole a URL de manifesto:

   ```
   https://raw.githubusercontent.com/devjohnfifth/ordem-paranormal-2e-foundry/dev/system.json
   ```

   (Esse é o manifesto do branch `dev`, instável. Pra instalar a versão **estável**, use o
   manifesto do branch `master` em vez desse:
   `https://raw.githubusercontent.com/devjohnfifth/ordem-paranormal-2e-foundry/master/system.json`)

3. Crie um mundo novo escolhendo o sistema **Ordem Paranormal RPG 2 (Playtest) [DEV]**.

**Opção B — copiando a pasta manualmente:**

1. Feche o Foundry, se estiver aberto.
2. Copie (ou crie um link simbólico para) esta pasta dentro de `Data/systems/` da sua
   instalação do Foundry, com o nome `op2e-playtest`:

   ```bash
   # Windows (PowerShell, como administrador), a partir desta pasta:
   New-Item -ItemType SymbolicLink -Path "C:\Caminho\Para\FoundryData\Data\systems\op2e-playtest" -Target "$PWD"
   ```

3. Abra o Foundry, crie um mundo novo escolhendo o sistema **Ordem Paranormal RPG 2 (Playtest)**.

## Compilando os compêndios

Os compêndios são versionados como arquivos JSON soltos em `packs/_source/`, e compilados
para o formato binário (LevelDB) que o Foundry lê, em `packs/`. Isso facilita revisar
diffs no git.

```bash
npm install
npm run build:packs     # packs/_source/*  ->  packs/*  (o que o Foundry carrega)
npm run extract:packs   # packs/*          ->  packs/_source/*  (depois de editar pelo próprio Foundry)
```

Rode `npm run build:packs` sempre que editar algo em `packs/_source/` pelo editor de texto.
Se preferir editar o conteúdo pela interface do Foundry (mais fácil para textos longos),
edite os compêndios já compilados no mundo e depois rode `npm run extract:packs` para
trazer as mudanças de volta para os arquivos-fonte (e poder commitar o diff).

## O que já está pronto

- **Ficha de Personagem**: perfil, ocupação, papel (sobrevivente/agente), nível, NEX,
  os 3 atributos e as 20 perícias (incluindo os 6 campos de Aptidão), PV/PD, Ímpeto
  (quando o personagem tem essa habilidade), habilidades, inventário e ferramentas.
- **Ficha de Ameaça**: PV e notas — deliberadamente simples, já que o playtest não trouxe
  ainda regras de criaturas/combate completo.
- **Mecânica de Teste, de verdade jogável**: clicar em qualquer perícia abre um diálogo
  onde dá pra ajustar a DT, aplicar aumento/redução de passo (regra de Ajuda e vantagens
  situacionais) e adicionar até 2 dados extras (regra de "Modificando Testes", máx. 4
  dados somando os 3 melhores) antes de rolar. Detecta sucesso/falha crítica e RA/RB
  automaticamente, publica um card no chat, e preenche a barra de Ímpeto sozinho quando o
  teste falha.
- **Ímpeto**: recurso rastreável (não só texto) para os perfis Executor que o possuem,
  com botão para gastar espaços preenchidos.
- **Testes de Ferimento (0 PV) e Trauma (0 PD)**: botões dedicados, com a DT escalando
  +3 a cada tentativa, exatamente como a regra descreve.
- **Compêndio "Personagens Prontos"**: os 10 pregens oficiais de "A Maldição do Ídolo de
  Pedra" — Alan, Edgar, Eloísa, Kênia e Victor (Ato I, sobreviventes nível 2) e Amanda,
  Antônio, Heitor, Raven e Val (Ato II, agentes nível 6) — com atributos, perícias e
  habilidades transcritos das fichas oficiais, retrato, token e histórico (imagem oficial)
  na biografia.
- **Compêndio "Ferramentas da Ordo Realitas"**: os 9 equipamentos de investigação do Ato II
  (Laboratório Portátil, Câmera Modificada, Lanterna UV, Laser de Varredura, Leitor
  Infravermelho, Medidor EMF, Pó Revelador, Rádio Modificado, Termômetro Diferencial) mais
  o item Compêndio da Ordem, como Items do tipo `ferramenta`.
- **Compêndio "Regras do Playtest (Resumo)"**: um Journal com as regras resumidas
  (perfis, atributos/perícias, testes, cenas de investigação, desafios de acesso,
  ferimentos/traumas, combate provisório), visível a jogadores.
- **Compêndio "Compêndio da Ordem (GM)"**: os 5 casos catalogados (elementos, códigos e
  pistas) e uma tabela-resumo de sinais por elemento, visível apenas ao mestre.
- **Compêndio "Materiais de Jogo"**: os 4 mapas oficiais e os 24 handouts de "A Maldição
  do Ídolo de Pedra" (Ato I e II), como páginas de imagem em Journals, visível apenas ao
  mestre.
- **Pasta "Pontos de Interesse — Ato I"** (dentro do Compêndio da Ordem): os 24 pontos de
  interesse numerados de "A Maldição do Ídolo de Pedra" — Ato I, com as tabelas de
  Perícia/DT/Informação, referências aos handouts e as notas de mestre (o que realmente
  aconteceu). Dividido em dois Journals: **O Porão** (mapa-cola com a legenda numerada,
  pontos 01–17, e a mecânica de "A Maldição do Ídolo de Pedra") e **A Sala Secreta**
  (pontos 18–24 e a Narração Final).
- **Compêndio "Mecânicas de Acesso"**: as regras detalhadas de Destrancar, Arrombar,
  Hackear (técnico e social), Alcançar (seguro e arriscado) e Sustentar — visível a
  jogadores, para consulta rápida durante o desafio.
- **Compêndio "Itens da Aventura"**: os itens narrativos de "A Maldição do Ídolo de
  Pedra" — Faca de Churrasco (arma improvisada, dano RA+2), Molho de Chaves 1, Molho de
  Chaves 2 e o Ídolo de Pedra — prontos para arrastar para a ficha de um personagem
  quando encontrados em jogo.

## Usando os mapas e a trilha sonora

Os mapas ficam disponíveis como imagens no compêndio **Materiais de Jogo**, não como
Cenas prontas (o schema de Scene mudou bastante entre o Foundry v13 e v14, e cada mesa
configura grid/iluminação diferente). Para criar a cena: arraste o arquivo de
`assets/mapas/` direto para a aba **Cenas** na sidebar — o próprio Foundry cria a Scene
já apontando pra imagem certa, e depois é só ajustar o grid.

A trilha sonora ("O Porão" e "O Ídolo") já vem pronta no compêndio **Trilhas Sonoras — Ato
I** (tipo Playlist) — arraste a playlist de lá pro mundo e as duas faixas já vêm dentro,
prontas pra tocar.

## Macros

O compêndio **Macros Úteis** traz uma pasta "Macros" com utilitários pro mestre. Arraste
qualquer uma delas do compêndio pra sua hotbar para usar:

- **Alternar Luzes da Cena** — apaga/acende todas as luzes da cena atual num clique só.
- **Revelar Handout** — em vez de só "Mostrar Imagem" (que aparece na hora e depois some),
  essa macro deixa escolher qual handout (de qualquer um dos compêndios de Materiais de
  Jogo) liberar pros jogadores: ela mostra o pop-up na hora **e** salva a página num
  Journal do mundo chamado "Handouts Revelados" (criado automaticamente na primeira vez),
  visível a qualquer jogador dali em diante. Assim dá pra ir liberando os handouts aos
  poucos, conforme a investigação avança, em vez de tudo de uma vez — e o jogador sempre
  consegue voltar e conferir um handout que já foi mostrado antes. Na primeira vez que um
  handout é revelado, ela também cria a macro **Meus Handouts** e fixa ela no **slot 3 da
  hotbar de todo jogador** (inclusive jogadores que entrarem depois) — um "livrinho" que
  abre o Journal "Handouts Revelados" com um clique, só com o que já foi mostrado pra
  aquele jogador, sem aparecer nada pros outros.
- **Resetar Handouts Revelados** — apaga todas as páginas do Journal "Handouts Revelados",
  voltando tudo ao estado inicial (como se nenhum handout tivesse sido mostrado ainda).
  Pede confirmação antes, porque não dá pra desfazer. Útil pra recomeçar uma campanha ou
  corrigir um handout revelado por engano.

## Usando com o módulo Party Sheet

Se você usa o módulo [Party Sheet](https://foundryvtt.com/packages/fvtt-party-sheet), este
sistema não aparece automaticamente porque o módulo precisa de um arquivo de template JSON
específico (ele não faz parte do pacote do sistema — vai na pasta `Data/partysheets/` do
próprio Foundry, não em `Data/systems/`). O template já pronto está em
`extras/party-sheet/op2e-playtest.json`: copie esse arquivo para a pasta
`<Foundry>/Data/partysheets/` (ou envie pelo botão de upload do próprio módulo) e reabra a
Party Sheet.

Se a Party Sheet abrir vazia ("No players are currently logged in") mesmo com o template
instalado, é a configuração **"Enable Only Online"** do próprio módulo (ligada por
padrão) — ela só lista personagens de jogadores conectados no momento. Desligue em
**Configurar Ajustes → Módulos → Party Sheet** pra ver todos os personagens
independente de quem está online (útil pra preparar mesa sozinho).

## Usando com o módulo PartyWatch

O [PartyWatch](https://foundryvtt.com/packages/partywatch) mostra um overlay com a
barra de vida do grupo, mas por padrão ele:

1. só lista jogadores com um **Personagem atribuído** (Configurar Jogadores → clique no
   ator de cada usuário — sem isso ele mostra "No active characters found");
2. lê o HP de campos no formato do dnd5e (`system.attributes.hp.value`/`.max`), que não
   existem neste sistema, então mesmo com o personagem atribuído a barra fica vazia.

Pra corrigir o item 2, vá em **Configurar Ajustes → Módulos → PartyWatch** e troque:
- **HP Data Path** → `system.recursos.pv.value`
- **Max HP Data Path** → `system.recursos.pv.max`

Pra também mostrar os **Pontos de Determinação (PD)**, ainda em Configurar Ajustes →
Módulos → PartyWatch: ligue **"Enable Extra Attributes"** e, na lista de atributos
extras, adicione um com:
- **Path** → `system.recursos.pd.value`
- **Max Path** → `system.recursos.pd.max`
- **Type** → `Badge`

Isso mostra um selo com o PD atual/máximo ao lado da barra de PV de cada personagem.

## Barras de recurso do token (módulo Bar Brawl)

Se o módulo [Bar Brawl](https://foundryvtt.com/packages/barbrawl) estiver ativo, o
sistema já registra sozinho (na primeira vez que o mundo carrega, em
`module/helpers/barbrawl.mjs`) um visual padrão pras barras de PV/PD no token:
gradiente vermelho→verde (PV) e escuro→azul (PD), sempre visíveis (não só ao passar o
mouse). Isso só é aplicado a atores que ainda não têm bars configuradas; se você já
personalizou os seus, nada é sobrescrito.

O Bar Brawl também tem um modo "subdivisions" que desenha a barra em N segmentos fixos
(tipo pips) em vez de lisa — mas ele troca o **valor mostrado** pela aproximação em N
partes (ex.: um PV 18/18 apareceria como "5/5"), então não usamos isso por padrão:
prioriza mostrar o valor real. Quem preferir o visual segmentado mesmo assim pode ligar
por token, na engrenagem de configuração de cada barra.

Duas coisas ficam a critério de cada mestre (preferência pessoal, o sistema não mexe
nelas sozinho), em **Configurar Ajustes → Módulos → Bar Brawl**:
- **Bar Style** → "Large" deixa as barras mais grossas/encorpadas.
- **Text Style** → "Fraction" mostra o valor exato (ex. "10/10") escrito na barra.

**Sobre animação:** o Bar Brawl desenha as barras direto no canvas (PIXI/WebGL) e não
tem transição suave quando o valor muda — ele redesenha na hora, sem animar. Isso é uma
limitação do próprio módulo, não algo que dá pra ligar. Se animação suave é importante,
o overlay do **PartyWatch** (seção acima) já tem isso pronto, porque é feito em
HTML/CSS, uma tecnologia bem diferente do Bar Brawl.

## Módulos "agnósticos de sistema" que precisam de configuração extra

Nem todo módulo que se anuncia como "system-agnostic" funciona pronto — vários dependem
de um arquivo/plugin específico por sistema pra saber onde ler os dados (perícias, PV,
etc.), e esse arquivo só existe pros sistemas mais populares por padrão:

- **Party Sheet** — resolvido, ver seção acima.
- **PartyWatch** — resolvido, ver seção acima.
- **Bar Brawl** — o sistema já configura sozinho, ver seção acima.
- **Token Action HUD** — o módulo-base (`token-action-hud-core`) não gera nenhuma ação
  sozinho: ele depende de um módulo companheiro por sistema (ex.:
  `token-action-hud-dnd5e`) que ainda não existe pra Ordem Paranormal RPG 2. Sem ele, o
  HUD abre vazio ou com poucas opções genéricas — isso não é um bug deste sistema, é a
  ausência de um módulo companheiro (criar um é um projeto separado, bem maior que uma
  correção pontual).
- Outros módulos desse tipo (barras de recurso customizadas, macros de automação
  genéricas etc.) tendem a funcionar para o que é realmente genérico (nome, imagem,
  PV/PD via `system.recursos.pv`/`system.recursos.pd`, que são os *token attributes*
  declarados no `system.json`), mas qualquer recurso que dependa de um mapeamento
  específico por sistema (como o Party Sheet) vai precisar da mesma configuração manual.

## O que falta (de propósito)

- **Os pontos de interesse do Ato II** ("A Maldição do Ídolo de Pedra", parte exclusiva
  dos assinantes dos Arquivos Secretos) ainda não foram transcritos — só o Ato I (conteúdo
  gratuito) está pronto por enquanto. Fica para uma rodada futura.
- **Cenas e Playlist prontas**: ver seção acima — é rápido de montar você mesmo pelo
  Foundry.
- **Rituais, poderes e NEX**: fora do escopo deste playtest.

## Estrutura do projeto

```
system.json              Manifesto do sistema
module/                  Código-fonte (ESM)
  op2e.mjs                 Ponto de entrada
  config.mjs                Atributos, perícias, perfis, escala de dados
  data/                    DataModels (Actor: personagem/ameaca; Item: habilidade/ferramenta/item)
  documents/               Subclasses de Actor/Item (rolagens)
  sheets/                  Fichas (ApplicationV2 + HandlebarsApplicationMixin)
  dice/                    Mecânica de Teste (2 dados, RA/RB, críticos)
  helpers/                 Helpers de Handlebars
templates/                Fichas e chat card (.hbs)
lang/                     pt-BR (único idioma do sistema)
css/                      Estilos da ficha
packs/_source/             Fonte editável dos compêndios (JSON solto)
packs/                     Compêndios compilados (gerado, não versionar manualmente)
assets/personagens/         Retratos, tokens e históricos dos 10 pregens
assets/mapas/                Os 4 mapas oficiais (Ato I e II)
assets/handouts/              Os 24 handouts oficiais
assets/audio/                  As 2 faixas de trilha sonora
scripts/                   build-packs.mjs / extract-packs.mjs
```

## Aviso

Este é um projeto de fã para uso pessoal de mesa, sem fins comerciais. Ordem Paranormal é
uma marca registrada da Jambô Editora / Rafael "Cellbit" Lange. Este compêndio não deve ser
redistribuído publicamente com conteúdo do playtest além do que já é gratuito.
