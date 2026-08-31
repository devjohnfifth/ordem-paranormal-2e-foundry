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
  os 3 atributos e as 20 perícias (incluindo os 6 campos de Aptidão), PV/PD, habilidades,
  inventário e ferramentas, com botões de rolagem de perícia e de testes de
  ferimento/trauma.
- **Ficha de Ameaça**: PV e notas — deliberadamente simples, já que o playtest não trouxe
  ainda regras de criaturas/combate completo.
- **Mecânica de Teste**: 1 dado de atributo + 1 dado de perícia (até 4 dados com bônus,
  somando os 3 melhores), DT padrão 7, detecção automática de sucesso/falha crítica,
  RA/RB, tudo publicado como card de chat.
- **Compêndio "Ferramentas da Ordo Realitas"**: os 9 equipamentos de investigação do Ato II
  (Laboratório Portátil, Câmera Modificada, Lanterna UV, Laser de Varredura, Leitor
  Infravermelho, Medidor EMF, Pó Revelador, Rádio Modificado, Termômetro Diferencial) mais
  o item Compêndio da Ordem, como Items do tipo `ferramenta`.
- **Compêndio "Regras do Playtest (Resumo)"**: um Journal com as regras resumidas
  (perfis, atributos/perícias, testes, cenas de investigação, desafios de acesso,
  ferimentos/traumas, combate provisório), visível a jogadores.
- **Compêndio "Compêndio da Ordem (GM)"**: os 5 casos catalogados (elementos, códigos e
  pistas) e uma tabela-resumo de sinais por elemento, visível apenas ao mestre.

## O que falta (de propósito)

- **Personagens prontos (pregens)**: as fichas dos personagens jogáveis de "A Maldição do
  Ídolo de Pedra" (Alan, Victor, Eloísa, Edgar, Kênia no Ato I; Amanda, Antônio, Heitor, Val,
  Raven no Ato II) são apresentadas como **imagens/diagramação gráfica** no PDF, não como
  texto — não foi possível extrair os valores exatos de atributos, perícias e habilidades
  deles automaticamente. Se você tiver as fichas em outro formato (ou puder me passar os
  valores manualmente), eu monto os Actors prontos no compêndio.
- **A missão "A Maldição do Ídolo de Pedra"** (mapas, pontos de interesse sala-a-sala,
  handouts) não foi transcrita para Journal/Scene: é conteúdo narrativo extenso e protegido
  por direitos autorais da Jambô Editora, então não deve ser reproduzido em massa mesmo para
  uso pessoal. Ficam prontas a estrutura de dados (Actor/Item) e a mecânica para você
  popular essa aventura com suas próprias palavras, ou usando os handouts oficiais do PDF
  diretamente como imagens/anexos no seu mundo.
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
scripts/                   build-packs.mjs / extract-packs.mjs
```

## Aviso

Este é um projeto de fã para uso pessoal de mesa, sem fins comerciais. Ordem Paranormal é
uma marca registrada da Jambô Editora / Rafael "Cellbit" Lange. Este compêndio não deve ser
redistribuído publicamente com conteúdo do playtest além do que já é gratuito.
