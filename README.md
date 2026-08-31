# Ordem Paranormal RPG 2 — Playtest (Foundry VTT)

Sistema **não-oficial** para Foundry VTT, feito para uso pessoal de mesa, baseado no
primeiro Playtest Alpha de **Ordem Paranormal RPG 2** (Rafael "Cellbit" Lange / Jambô Editora),
lançado no Pacote #8 dos Arquivos Secretos (agosto/2026).

> Ordem Paranormal 2 ainda está em desenvolvimento. Este playtest cobre apenas atributos,
> perícias, perfis psicológicos, testes, cenas de investigação, desafios de acesso e uma
> versão simplificada de ferimentos/traumas/combate. Regras de rituais, poderes, NEX e
> combate completo ainda não foram publicadas — os campos existem na ficha, mas ficam
> em aberto até um próximo pacote trazer as regras oficiais.

Compatível com **Foundry VTT v13+** (testado como alvo a v14.365 — verifique o número exato
da sua instalação, pois este projeto não pôde ser testado ao vivo neste ambiente).

## Instalação

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

## Usando os mapas e a trilha sonora

Por segurança (o schema de Scene mudou bastante entre o Foundry v13 e v14, e eu não
consigo testar ao vivo neste ambiente), os mapas ficam disponíveis como imagens no
compêndio **Materiais de Jogo**, não como Cenas prontas. Para criar a cena: abra a
página do mapa no Journal, clique com o botão direito na imagem e escolha **"Criar
Cena"** (ou arraste o arquivo de `assets/mapas/` direto para a aba Cenas) — o próprio
Foundry monta a Scene no formato certo para a sua versão.

A trilha sonora ("O Porão" e "O Ídolo") está em `assets/audio/`, fora dos compêndios pelo
mesmo motivo — arraste os arquivos `.mp3` para a aba Playlists para usá-los.

## O que falta (de propósito)

- **A missão "A Maldição do Ídolo de Pedra"** (pontos de interesse sala-a-sala, com DTs,
  perícias e textos de investigação) não foi transcrita para Journal: é conteúdo
  narrativo extenso e protegido por direitos autorais da Jambô Editora — reproduzi-lo por
  completo, mesmo para uso pessoal, ultrapassa o que é razoável. Os mapas e handouts
  oficiais (que a própria editora distribui como "arquivos para o público") já estão no
  compêndio; a descrição de cada ponto de interesse fica por sua conta, com o PDF em mãos.
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
lang/                     pt-BR (padrão) e en
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
