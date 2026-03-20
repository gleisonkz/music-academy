# PRD - Página de Prática de Backing Vocal

## 1. Visão Geral do Produto

### 1.1 Objetivo
Criar uma página web interativa para prática de backing vocal que permite aos músicos reproduzir múltiplas faixas de áudio simultaneamente, controlar individualmente cada faixa, e seguir letras sincronizadas em tempo real com formatação visual para identificar diferentes partes vocais.

### 1.2 Contexto
A aplicação faz parte de uma plataforma educacional musical (Musix Studio) e serve como ferramenta de estudo e prática para músicos que precisam aprender e praticar backing vocals de músicas específicas.

### 1.3 Público-Alvo
- Músicos profissionais e amadores
- Cantores de backing vocal
- Estudantes de música
- Regentes de coro
- Produtores musicais

---

## 2. Requisitos Funcionais

### 2.1 Sistema de Reprodução de Áudio Multi-Faixa

#### 2.1.1 Faixas de Áudio Disponíveis
A aplicação deve suportar a reprodução simultânea de **7 faixas de áudio** distintas:

1. **Tenor** - Faixa vocal de tenor
2. **Contralto** - Faixa vocal de contralto
3. **Soprano** - Faixa vocal de soprano
4. **Click** - Metrônomo/click track
5. **Guia** - Faixa guia (usada para sincronização de tempo)
6. **Voz** - Voz principal
7. **VS** - Faixa adicional de backing

**Especificações Técnicas:**
- Formato de áudio: MP3
- Biblioteca de reprodução: Howler.js
- Modo HTML5: Habilitado
- Todas as faixas devem ser carregadas simultaneamente na inicialização
- Cada faixa é uma instância independente de Howl

#### 2.1.2 Controles Globais de Reprodução

**Botão "Tocar" (Play All)**
- Ação: Inicia a reprodução de todas as faixas ativas simultaneamente
- Comportamento: 
  - Chama `play()` em todas as instâncias Howl
  - Mantém sincronização entre todas as faixas
  - Não reinicia faixas que já estão tocando
- Estado visual: Botão deve indicar estado de reprodução

**Botão "Parar" (Stop All)**
- Ação: Para a reprodução de todas as faixas
- Comportamento:
  - Chama `stop()` em todas as instâncias Howl
  - Reseta a posição de todas as faixas para o início
  - Interrompe o tracking de tempo
- Estado visual: Botão destrutivo (vermelho)

#### 2.1.3 Controle de Volume Geral

**Slider de Volume Mestre**
- Tipo: Input range (slider)
- Faixa de valores: 0.0 a 1.0 (0% a 100%)
- Incremento: 0.01 (1%)
- Exibição:
  - Label: "Volume Geral"
  - Valor atual em porcentagem: `(masterVolume * 100).toFixed(0) + '%'`
  - Ícones: 🔇 (mudo) à esquerda, 🔊 (alto) à direita
- Comportamento:
  - Ao alterar o slider, atualiza o volume de todas as faixas simultaneamente
  - Aplica `sound.volume(volume)` em todas as instâncias Howl
  - Atualização em tempo real (evento `input`)
- Estilo:
  - Slider customizado com CSS
  - Track cinza claro (#e5e7eb)
  - Thumb azul (#3b82f6) com hover (#2563eb)
  - Altura do track: 8px
  - Tamanho do thumb: 20x20px
  - Transições suaves

#### 2.1.4 Controles Individuais por Faixa

**Checkbox por Faixa**
- Uma checkbox para cada uma das 7 faixas
- Estado:
  - Marcado = Faixa ativa (não mutada)
  - Desmarcado = Faixa mutada
- Comportamento:
  - Ao clicar, alterna o estado de mute/unmute da faixa específica
  - Chama `howl.mute(!howl.mute())`
  - Atualiza o estado no `AudioService.isMuted[index]`
- Visual:
  - Checkbox grande (20x20px)
  - Label com nome da faixa
  - Container com borda azul quando ativo
  - Background azul claro quando ativo
  - Cursor pointer

**Controles em Lote**

**Botão "Marcar todos" (Unmute All)**
- Ação: Ativa todas as faixas (desmuta todas)
- Comportamento:
  - Itera sobre todas as faixas
  - Chama `howl.mute(false)` em cada uma
  - Atualiza `AudioService.isMuted` para `false` em todos os índices
- Estado visual: Botão outline

**Botão "Desmarcar todos" (Mute All)**
- Ação: Desativa todas as faixas (muta todas)
- Comportamento:
  - Itera sobre todas as faixas
  - Chama `howl.mute(true)` em cada uma
  - Atualiza `AudioService.isMuted` para `true` em todos os índices
- Estado visual: Botão outline

---

### 2.2 Sidebar de Controle

#### 2.2.1 Estrutura da Sidebar
- Posição: Fixa à direita da tela
- Largura máxima: 189px
- Altura: 100vh (altura total da viewport)
- Background: #f5f5f5 (cinza claro)
- Border-radius: 8px
- Box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
- Padding: 20px
- Z-index: 1
- Transição: transform 0.3s ease-in-out

#### 2.2.2 Informações da Música
Exibidas no topo da sidebar:

**Título da Música**
- Exibição: `<título> - <artista>`
- Estilo: H1, centralizado
- Exemplo: "Único - Fernandinho"

**Tom da Música**
- Exibição: "Tom: <key>"
- Exemplo: "Tom: Gm"
- Estilo: Parágrafo, abaixo do título

#### 2.2.3 Player de Áudio Integrado
- Componente: `<ma-audio-player>`
- Recebe prop: `[sounds]="sounds"` (array de HowlAudio)
- Posicionado abaixo das informações da música
- Ocupa o restante do espaço disponível na sidebar

#### 2.2.4 Botão Toggle da Sidebar
- Posição: Fixo, canto inferior direito
- Tamanho: 60x60px
- Z-index: 2 (acima da sidebar)
- Ícone: ☰ (hamburger menu)
- Comportamento:
  - Ao clicar, alterna estado `isPlayerSidebarOpen`
  - Quando fechada: `transform: translateX(100%)` (esconde para a direita)
  - Quando aberta: `transform: translateX(0)` (visível)
- Estado inicial: Aberta (`signal(true)`)

---

### 2.3 Visualização de Letras Sincronizadas

#### 2.3.1 Estrutura de Dados das Letras

**Hierarquia:**
```
Song
├── sections[] (Array de seções)
    ├── title (string) - Nome da seção
    ├── time (number) - Timestamp em segundos
    └── lyrics[] (Array opcional de letras)
        ├── time (number) - Timestamp em segundos
        └── text (string) - Texto da letra
```

**Exemplo de Estrutura:**
```typescript
{
  title: 'Refrão - (1º vez)',
  time: 45.616,
  lyrics: [
    { time: 45.616, text: '-Único Tu és o único-' },
    { time: 50.958, text: '-Incomparável és na minha vida-' },
    { time: 57.945, text: '-Meu coração não cabe outro amor-' },
    { time: 64.321, text: '-Tudo que tenho e sou é tudo Teu-' }
  ]
}
```

#### 2.3.2 Renderização das Letras

**Container de Letras**
- Classe: `.lyrics-container`
- Largura: 100%
- Display: Flex column
- Alinhamento: Centralizado
- Responsivo: Em telas < 600px, muda para `display: block`

**Seções**
- Renderização: Loop `@for` sobre `song.sections`
- Atributo: `[attr.song-section-id]="sectionIndex"`
- Classe: `.song-section`
- Estilo:
  - Font-weight: bold
  - Margin-top: 10px
  - Cursor: pointer
  - Padding: 5px
  - Transição: all 0.3s ease
- Estado ativo:
  - Classe `.active` quando `sectionIndex === sectionActiveIndex`
  - Quando ativa: font-size 22px, font-weight bold

**Linhas de Letra**
- Renderização: Loop `@for` aninhado sobre `section.lyrics`
- Classe: `.select-none` (previne seleção de texto)
- Diretiva: `maTextFormat` (aplica formatação visual)
- Estilo:
  - Font-size: 16px (padrão)
  - Cursor: pointer
  - Padding: 5px
  - Transição: all 0.3s ease
  - Hover: text-decoration underline
- Estado ativo:
  - Classe `.active` quando `lyricIndex === lyricActiveIndex && sectionIndex === sectionActiveIndex`
  - Quando ativa: font-size 22px, font-weight bold

#### 2.3.3 Sincronização em Tempo Real

**Tracking de Tempo**
- Fonte de tempo: Faixa "Guia" (track principal de referência)
- Método: `trackTimeUpdate()`
- Trigger: Callback `onplay` da faixa Guia
- Implementação: `requestAnimationFrame` para loop contínuo
- Frequência: ~60 FPS (sincronizado com refresh rate do navegador)

**Algoritmo de Sincronização**
1. Obtém tempo atual: `sound.howl.seek()` da faixa Guia
2. Chama `updateLyrics(currentTime)`
3. Se a faixa ainda está tocando, agenda próximo frame: `requestAnimationFrame(trackTimeUpdate)`

**Atualização de Letras (`updateLyrics`)**
1. Itera sobre todas as seções
2. Arredonda tempo para 3 casas decimais: `Math.floor(currentTime * 1000) / 1000`
3. Verifica se está dentro da tolerância de uma seção (0.05s)
4. Se dentro da tolerância, faz scroll automático para a seção
5. Atualiza `sectionActiveIndex` para a última seção cujo tempo foi ultrapassado
6. Para cada seção com letras:
   - Itera sobre as letras
   - Atualiza `lyricActiveIndex` para a última letra cujo tempo foi ultrapassado

**Tolerância de Tempo**
- Valor: 0.05 segundos (50ms)
- Função: `compareWithTolerance(num1, num2, tolerance)`
- Propósito: Compensar pequenas diferenças de timing e garantir scroll suave

**Scroll Automático**
- Método: `scrollIntoView({ behavior: 'smooth' })`
- Target: Elemento da seção atual ou elemento anterior
- Comportamento: Scroll suave (smooth scrolling)
- Trigger: Quando o tempo atual está dentro da tolerância de uma seção

#### 2.3.4 Navegação por Clique

**Clique em Seção**
- Ação: Chama `jumpTo(section.time)`
- Comportamento:
  - Define posição de todas as faixas para `section.time` usando `howl.seek(time)`
  - Inicia reprodução de todas as faixas com `playAll()`
  - Atualiza imediatamente o estado visual das letras

**Clique em Linha de Letra**
- Ação: Chama `jumpTo(lyric.time)`
- Comportamento:
  - Define posição de todas as faixas para `lyric.time` usando `howl.seek(time)`
  - Inicia reprodução de todas as faixas com `playAll()`
  - Atualiza imediatamente o estado visual das letras

**Método `jumpTo(time)`**
```typescript
jumpTo(time: number): void {
  // Sincroniza todas as faixas para o mesmo tempo
  this.sounds.forEach((sound) => {
    sound.howl.seek(time);
  });
  // Inicia reprodução
  this.playAll();
}
```

---

### 2.4 Sistema de Formatação Visual de Letras

#### 2.4.1 Diretiva de Formatação
- Nome: `maTextFormat`
- Seletor: `[maTextFormat]`
- Tipo: Diretiva Angular standalone
- Aplicação: Aplicada em cada elemento `<p>` que contém letras

#### 2.4.2 Símbolos de Formatação

**Sistema de Marcadores:**
- `-texto-` → Background laranja (#ff7300) - Backing vocal padrão
- `+texto+` → Background rosa/magenta (#f047ff) - Melodia específica (ex: Tenor)
- `@texto@` → Background vermelho (#ff0000) - Outra melodia específica (ex: Soprano)
- `=texto=` → Background verde (#3ef127) - Destaque especial

**Expressão Regular:**
```typescript
const regex = /([+-=@])([^+-=@]+)\1/g;
```

**Processamento:**
1. Captura texto entre símbolos correspondentes
2. Remove espaços em branco com `trim()`
3. Aplica estilo inline com `background-color`
4. Substitui no HTML usando `innerHTML`

#### 2.4.3 Exemplos de Uso

**Exemplo 1 - Backing e Melodia:**
```
Texto original: 'Eu não tenho para onde ir (-ah ah ah-) (-ah ah-) (-ah ah-)'
Resultado visual: 
  - "Eu não tenho para onde ir" (texto normal)
  - "ah ah ah" (background laranja, 3 vezes)
```

**Exemplo 2 - Múltiplas Melodias:**
```
Texto original: '+Único Tu é o único+  - [TENOR MELODIA]'
Resultado visual:
  - "Único Tu é o único" (background rosa)
  - " - [TENOR MELODIA]" (texto normal)
```

**Exemplo 3 - Melodia Combinada:**
```
Texto original: 'Tua voz a me chamar (-tua voz a me- +chamar+)'
Resultado visual:
  - "Tua voz a me chamar" (texto normal)
  - "tua voz a me" (background laranja)
  - "chamar" (background rosa)
```

#### 2.4.4 Anotações nas Letras
- Formato: `[VOZ MELODIA]`, `[TENOR MELODIA]`, `[SOPRANO MELODIA]`, `[CONTRALTO MELODIA]`
- Propósito: Identificar qual voz está cantando a melodia marcada
- Renderização: Texto normal (sem formatação especial)

---

### 2.5 Estrutura de Dados da Música

#### 2.5.1 Metadados da Música
```typescript
{
  title: string;      // Título da música
  artist: string;     // Nome do artista
  key: string;        // Tom da música (ex: "Gm", "C", "D")
}
```

#### 2.5.2 Faixas de Áudio
```typescript
{
  audios: {
    tenor: string;      // Caminho para arquivo MP3
    contralto: string;
    soprano: string;
    click: string;
    guia: string;
    voz: string;
    vs: string;
  }
}
```

#### 2.5.3 Seções e Letras
```typescript
{
  sections: Array<{
    title: string;           // Nome da seção
    time: number;            // Timestamp em segundos (precisão de 3 casas)
    lyrics?: Array<{         // Opcional
      time: number;          // Timestamp em segundos
      text: string;          // Texto da letra (pode conter marcadores)
    }>
  }>
}
```

#### 2.5.4 Exemplo Completo
```typescript
song = {
  title: 'Único',
  artist: 'Fernandinho',
  key: 'Gm',
  audios: {
    tenor: 'assets/audio/kit-ensaio/unico-fernandinho/TENOR.mp3',
    contralto: 'assets/audio/kit-ensaio/unico-fernandinho/CONTRALTO.mp3',
    soprano: 'assets/audio/kit-ensaio/unico-fernandinho/SOPRANO.mp3',
    click: 'assets/audio/kit-ensaio/unico-fernandinho/CLICK146.mp3',
    guia: 'assets/audio/kit-ensaio/unico-fernandinho/GUIA.mp3',
    voz: 'assets/audio/kit-ensaio/unico-fernandinho/VOZ.mp3',
    vs: 'assets/audio/kit-ensaio/unico-fernandinho/VS.mp3',
  },
  sections: [
    {
      title: 'Intro',
      time: 0,
      // Sem letras
    },
    {
      title: 'Verso 1 - (1º vez)',
      time: 19.726,
      lyrics: [
        { time: 19.726, text: 'Eu não tenho para onde ir' },
        { time: 23.424, text: 'Teu perfume está marcado em mim' },
        { time: 26.712, text: 'Na sombra de Tuas asas eu estou' },
      ],
    },
    // ... mais seções
  ],
};
```

---

### 2.6 Serviço de Áudio

#### 2.6.1 AudioService
- Tipo: Injectable, providedIn: 'root'
- Propósito: Gerenciar estado global de áudio

**Propriedades:**
- `isMuted: boolean[]` - Array que rastreia estado de mute de cada faixa
- `currentTimeSignal: signal(0)` - Signal reativo com tempo atual

**Métodos:**
- `toggleMute(index: number)` - Alterna estado de mute de uma faixa específica

#### 2.6.2 Inicialização
- No `ngOnInit` da página:
  - Cria array `sounds` com instâncias Howl
  - Inicializa `audioService.isMuted` com `false` para cada faixa
  - Configura callback `onplay` apenas na faixa "Guia" para tracking de tempo

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- **Tempo de carregamento inicial**: Todas as 7 faixas devem começar a carregar simultaneamente
- **Sincronização**: Tolerância máxima de 50ms entre faixas
- **Frame rate**: Tracking de tempo deve rodar a ~60 FPS (requestAnimationFrame)
- **Scroll suave**: Transições de scroll devem ser fluidas (behavior: 'smooth')

### 3.2 Compatibilidade
- **Navegadores**: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- **Dispositivos**: Desktop e tablet (mobile pode ter limitações de performance)
- **Formato de áudio**: MP3 (compatibilidade universal)

### 3.3 Acessibilidade
- **Navegação por teclado**: Todos os controles devem ser acessíveis via teclado
- **Feedback visual**: Estados ativos devem ser claramente indicados
- **Contraste**: Texto deve ter contraste adequado (WCAG AA mínimo)
- **Área de clique**: Botões e checkboxes devem ter área de clique mínima de 44x44px

### 3.4 Responsividade
- **Desktop**: Layout completo com sidebar visível
- **Tablet**: Sidebar pode ser retraída, letras centralizadas
- **Mobile**: Sidebar sempre retraída, layout vertical otimizado

### 3.5 Usabilidade
- **Feedback imediato**: Todas as ações devem ter feedback visual instantâneo
- **Estado persistente**: Estado de mute/unmute deve persistir durante a sessão
- **Navegação intuitiva**: Clique em qualquer letra deve pular para aquele momento
- **Controles acessíveis**: Todos os controles devem estar facilmente acessíveis

---

## 4. Especificações de Design

### 4.1 Layout Geral

**Container Principal**
- Background: #dde6e5 (verde água claro)
- Padding: 0
- Altura: 100vh

**Área de Conteúdo**
- Container de letras centralizado
- Largura máxima: 100%
- Padding lateral responsivo

### 4.2 Sidebar

**Quando Aberta:**
- Posição: Fixa à direita
- Largura: 189px
- Altura: 100vh
- Background: #f5f5f5
- Border-radius: 8px (canto superior direito)
- Box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
- Padding: 20px
- Overflow: hidden

**Quando Fechada:**
- Transform: translateX(100%)
- Transição: 0.3s ease-in-out

**Botão Toggle:**
- Posição: Fixed, bottom: 20px, right: 20px
- Tamanho: 60x60px
- Z-index: 2
- Estilo: Botão ghost (Zard UI)

### 4.3 Letras

**Seções:**
- Font-weight: bold
- Margin-top: 10px
- Cursor: pointer
- Padding: 5px
- Estado ativo: font-size 22px, font-weight bold

**Linhas de Letra:**
- Font-size: 16px (padrão), 22px (ativo)
- Cursor: pointer
- Padding: 5px
- Hover: text-decoration underline
- Estado ativo: font-size 22px, font-weight bold

**Cores de Formatação:**
- `-texto-`: Background #ff7300 (laranja)
- `+texto+`: Background #f047ff (rosa/magenta)
- `@texto@`: Background #ff0000 (vermelho)
- `=texto=`: Background #3ef127 (verde)

### 4.4 Player de Áudio

**Container de Volume:**
- Background: #f3f4f6 (cinza claro)
- Padding: 1rem
- Border-radius: 0.5rem
- Margin-bottom: 1.5rem

**Slider de Volume:**
- Track: #e5e7eb, altura 8px, border-radius 4px
- Thumb: #3b82f6, tamanho 20x20px, border-radius 50%
- Hover thumb: #2563eb, scale 1.1
- Transição: all 0.2s ease

**Checkboxes:**
- Tamanho: 20x20px
- Border: 2px solid #gray-300
- Background quando ativo: #green-600
- Container: border-2 border-blue-600 bg-blue-200
- Padding: 1rem
- Border-radius: 0.25rem

**Botões:**
- Usar componentes Zard UI
- Tipos: default, destructive, outline
- Largura: w-full quando necessário
- Espaçamento: gap-5 entre elementos

### 4.5 Animações e Transições

**Sidebar:**
- Transform: 0.3s ease-in-out

**Letras:**
- Transição: all 0.3s ease
- Scroll: behavior smooth

**Slider:**
- Transição: all 0.2s ease

**Cards (lista de músicas):**
- Hover: transform scale(1.1)
- Transição: transform 0.2s ease-in-out

---

## 5. Fluxos de Usuário

### 5.1 Fluxo Principal: Praticar uma Música

1. **Usuário acessa a página de detalhes da música**
   - URL: `/musix-studio/backing-practice/songs/detail/:id`
   - Página carrega metadados da música
   - Todas as 7 faixas começam a carregar

2. **Usuário visualiza informações da música**
   - Vê título, artista e tom na sidebar
   - Sidebar está aberta por padrão

3. **Usuário configura faixas desejadas**
   - Desmarca checkboxes das faixas que não quer ouvir
   - Ajusta volume geral se necessário

4. **Usuário inicia reprodução**
   - Clica em "Tocar"
   - Todas as faixas ativas começam a tocar simultaneamente
   - Letras começam a ser destacadas em tempo real

5. **Usuário segue as letras**
   - Letras são destacadas automaticamente conforme a música toca
   - Scroll automático mantém a linha atual visível
   - Usuário pode clicar em qualquer seção/letra para pular

6. **Usuário ajusta durante a reprodução**
   - Pode mutar/desmutar faixas individualmente
   - Pode ajustar volume geral
   - Pode pular para qualquer parte clicando nas letras

7. **Usuário para a reprodução**
   - Clica em "Parar"
   - Todas as faixas param e voltam ao início

### 5.2 Fluxo: Navegar para uma Parte Específica

1. **Usuário visualiza as letras**
   - Rola a página para encontrar a seção desejada

2. **Usuário clica em uma seção ou linha**
   - Sistema detecta o timestamp associado

3. **Sistema sincroniza todas as faixas**
   - Todas as faixas pulam para o timestamp
   - Reprodução inicia automaticamente

4. **Letras são atualizadas**
   - Estado visual é atualizado imediatamente
   - Scroll ajusta para mostrar a parte selecionada

### 5.3 Fluxo: Praticar uma Parte Específica

1. **Usuário identifica a parte a praticar**
   - Lê as letras e identifica a seção

2. **Usuário desativa outras faixas**
   - Deixa apenas a faixa que quer praticar ativa
   - Exemplo: Deixa apenas "Tenor" para praticar a parte de tenor

3. **Usuário pula para a seção**
   - Clica na seção desejada

4. **Usuário pratica**
   - Ouve apenas a faixa desejada
   - Segue as letras formatadas para entender a parte

5. **Usuário repete**
   - Para e reinicia a seção quantas vezes necessário

---

## 6. Casos de Uso Detalhados

### 6.1 UC-001: Reproduzir Todas as Faixas Simultaneamente

**Ator:** Músico

**Pré-condições:**
- Página carregada
- Todas as faixas carregadas

**Fluxo Principal:**
1. Músico clica em "Tocar"
2. Sistema inicia reprodução de todas as faixas ativas
3. Todas as faixas tocam sincronizadas
4. Letras começam a ser destacadas em tempo real

**Fluxo Alternativo:**
- Se alguma faixa estiver mutada, ela não toca
- Se alguma faixa já estiver tocando, não reinicia

**Pós-condições:**
- Todas as faixas ativas estão tocando
- Tracking de tempo está ativo
- Letras estão sendo atualizadas

### 6.2 UC-002: Controlar Volume Geral

**Ator:** Músico

**Pré-condições:**
- Página carregada

**Fluxo Principal:**
1. Músico move o slider de volume
2. Sistema atualiza `masterVolume` signal
3. Sistema aplica novo volume a todas as faixas
4. Sistema atualiza exibição de porcentagem

**Fluxo Alternativo:**
- Volume pode ser ajustado durante reprodução
- Volume pode ser ajustado antes de iniciar

**Pós-condições:**
- Todas as faixas têm o novo volume aplicado
- Exibição mostra porcentagem atualizada

### 6.3 UC-003: Mutar/Desmutar Faixa Individual

**Ator:** Músico

**Pré-condições:**
- Página carregada
- Faixa existe e está carregada

**Fluxo Principal:**
1. Músico clica no checkbox de uma faixa
2. Sistema alterna estado de mute da faixa
3. Sistema atualiza estado no AudioService
4. Sistema atualiza visual do checkbox

**Fluxo Alternativo:**
- Se a faixa estiver tocando, continua tocando mas mutada
- Se a faixa estiver mutada e o usuário desmarcar, desmuta

**Pós-condições:**
- Estado de mute da faixa foi alterado
- Visual do checkbox reflete o novo estado

### 6.4 UC-004: Seguir Letras em Tempo Real

**Ator:** Músico

**Pré-condições:**
- Música está tocando
- Faixa "Guia" está ativa

**Fluxo Principal:**
1. Sistema obtém tempo atual da faixa Guia
2. Sistema identifica seção atual baseada no tempo
3. Sistema identifica linha de letra atual
4. Sistema aplica classe `.active` à seção e linha
5. Sistema faz scroll automático se necessário
6. Sistema agenda próximo frame de atualização

**Fluxo Alternativo:**
- Se não houver letras para uma seção, apenas a seção é destacada
- Se o tempo estiver entre seções, mantém última seção ativa

**Pós-condições:**
- Seção e linha atuais estão destacadas
- Viewport mostra a parte relevante das letras

### 6.5 UC-005: Pular para Parte Específica

**Ator:** Músico

**Pré-condições:**
- Página carregada
- Faixas carregadas

**Fluxo Principal:**
1. Músico clica em uma seção ou linha de letra
2. Sistema obtém timestamp associado
3. Sistema chama `jumpTo(timestamp)`
4. Sistema define posição de todas as faixas para o timestamp
5. Sistema inicia reprodução de todas as faixas
6. Sistema atualiza estado visual das letras

**Fluxo Alternativo:**
- Se a música já estiver tocando, continua tocando a partir do novo ponto
- Se a música estiver parada, inicia a partir do novo ponto

**Pós-condições:**
- Todas as faixas estão no timestamp especificado
- Música está tocando
- Letras refletem o estado atual

### 6.6 UC-006: Identificar Partes Vocais com Formatação

**Ator:** Músico

**Pré-condições:**
- Página carregada
- Letras renderizadas

**Fluxo Principal:**
1. Músico visualiza letras na tela
2. Sistema aplica diretiva `maTextFormat` a cada linha
3. Sistema processa marcadores na letra
4. Sistema aplica cores de background conforme marcadores
5. Músico identifica visualmente diferentes partes vocais

**Exemplo:**
- Texto: `'+Único Tu é o único+'` → Background rosa (melodia Tenor)
- Texto: `'@Incomparável és na minha vida@'` → Background vermelho (melodia Soprano)
- Texto: `'(-ah ah ah-)'` → Background laranja (backing vocal)

**Pós-condições:**
- Letras estão formatadas visualmente
- Músico pode identificar partes vocais

---

## 7. Especificações Técnicas

### 7.1 Stack Tecnológico

**Framework:**
- Angular 18+ (standalone components)

**Bibliotecas:**
- Howler.js 2.2.4+ (reprodução de áudio)
- Zard UI (componentes de interface)
- Tailwind CSS (estilização)
- RxJS (programação reativa)

**Padrões:**
- Signals (Angular) para estado reativo
- Standalone components
- Dependency injection
- Directives para funcionalidades reutilizáveis

### 7.2 Estrutura de Componentes

```
SongDetailPage (Component principal)
├── AudioPlayerComponent (Componente de player)
│   ├── Controles de volume
│   ├── Controles de reprodução
│   └── Checkboxes de faixas
├── TextFormatDirective (Diretiva de formatação)
└── ZardSharedModule (Módulo de componentes UI)
```

### 7.3 Serviços

**AudioService:**
- Gerenciamento de estado global de áudio
- Rastreamento de mute/unmute
- Signal de tempo atual

### 7.4 Interfaces TypeScript

```typescript
interface HowlAudio {
  id: string;
  howl: Howl;
}

interface AudioPath {
  name: string;
  path: string;
}

interface Song {
  title: string;
  artist: string;
  key: string;
  audios: {
    tenor: string;
    contralto: string;
    soprano: string;
    click: string;
    guia: string;
    voz: string;
    vs: string;
  };
  sections: Array<{
    title: string;
    time: number;
    lyrics?: Array<{
      time: number;
      text: string;
    }>;
  }>;
}
```

### 7.5 Algoritmos

**Comparação com Tolerância:**
```typescript
function compareWithTolerance(num1: number, num2: number, tolerance: number): boolean {
  return Math.abs(num1 - num2) <= tolerance;
}
```

**Atualização de Letras:**
```typescript
updateLyrics(currentTime: number): void {
  // 1. Arredonda tempo para 3 casas decimais
  const currentTimeThreeDigits = Math.floor(currentTime * 1000) / 1000;
  
  // 2. Itera sobre seções
  for (let i = 0; i < this.song.sections.length; i++) {
    // 3. Verifica se está dentro da tolerância
    const isInSection = compareWithTolerance(
      currentTimeThreeDigits, 
      this.song.sections[i].time, 
      0.05
    );
    
    // 4. Faz scroll se necessário
    if (isInSection) {
      const line = this.document.querySelector(`[song-section-id="${i}"]`);
      const previousLine = line?.previousElementSibling;
      const targetLine = previousLine ?? line;
      targetLine?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 5. Atualiza seção ativa
    if (currentTime >= this.song.sections[i].time) {
      this.sectionActiveIndex = i;
    }
    
    // 6. Atualiza letra ativa
    if (this.song.sections[i].lyrics) {
      const lyrics = this.song.sections[i].lyrics!;
      for (let j = 0; j < lyrics.length; j++) {
        if (currentTime >= lyrics[j].time) {
          this.lyricActiveIndex = j;
        }
      }
    }
  }
}
```

**Formatação de Texto:**
```typescript
formatText(): void {
  const elementText = this.el.nativeElement.innerText;
  const regex = /([+-=@])([^+-=@]+)\1/g;
  
  const formattedText = elementText.replace(regex, (match, symbol, innerText) => {
    switch (symbol) {
      case '=': return `<span style="background-color: #3ef127">${innerText.trim()}</span>`;
      case '-': return `<span style="background-color: #ff7300">${innerText.trim()}</span>`;
      case '+': return `<span style="background-color: #f047ff">${innerText.trim()}</span>`;
      case '@': return `<span style="background-color: #ff0000">${innerText.trim()}</span>`;
      default: return innerText;
    }
  });
  
  this.renderer.setProperty(this.el.nativeElement, 'innerHTML', formattedText);
}
```

---

## 8. Tratamento de Erros e Edge Cases

### 8.1 Erros de Carregamento de Áudio

**Cenário:** Uma ou mais faixas falham ao carregar

**Tratamento:**
- Exibir mensagem de erro para a faixa específica
- Permitir que outras faixas continuem funcionando
- Desabilitar checkbox da faixa com erro
- Log de erro no console para debug

### 8.2 Sincronização Perdida

**Cenário:** Faixas ficam dessincronizadas durante reprodução

**Tratamento:**
- Usar faixa "Guia" como referência principal
- Implementar re-sincronização periódica (a cada 5 segundos)
- Permitir re-sincronização manual via botão

### 8.3 Timestamps Inválidos

**Cenário:** Timestamp de seção/letra está fora do range do áudio

**Tratamento:**
- Validar timestamps na inicialização
- Ignorar seções/letras com timestamps inválidos
- Exibir warning no console

### 8.4 Performance em Dispositivos Limitados

**Cenário:** Múltiplas faixas causam lag em dispositivos mais fracos

**Tratamento:**
- Reduzir qualidade de áudio se necessário
- Implementar lazy loading de faixas não essenciais
- Oferecer modo "performance" com menos faixas simultâneas

### 8.5 Navegação Durante Reprodução

**Cenário:** Usuário clica em letra enquanto música está tocando

**Tratamento:**
- Parar todas as faixas
- Sincronizar para novo timestamp
- Reiniciar reprodução
- Atualizar estado visual imediatamente

---

## 9. Métricas de Sucesso

### 9.1 Métricas de Performance
- **Tempo de carregamento inicial**: < 3 segundos para carregar todas as faixas
- **Latência de sincronização**: < 50ms entre faixas
- **Frame rate de tracking**: Mantém 60 FPS durante reprodução
- **Uso de memória**: < 100MB para todas as faixas carregadas

### 9.2 Métricas de Usabilidade
- **Taxa de conclusão de prática**: % de usuários que completam uma sessão
- **Tempo médio de sessão**: Tempo que usuários passam na página
- **Taxa de uso de controles**: Frequência de uso de cada controle
- **Taxa de erro**: % de ações que resultam em erro

### 9.3 Métricas de Engajamento
- **Retorno de usuários**: % de usuários que voltam para praticar
- **Número de músicas praticadas**: Média de músicas por usuário
- **Uso de formatação**: % de usuários que utilizam a formatação visual

---

## 10. Roadmap e Melhorias Futuras

### 10.1 Fase 1 (Atual)
- ✅ Reprodução multi-faixa
- ✅ Controles individuais
- ✅ Sincronização de letras
- ✅ Formatação visual

### 10.2 Fase 2 (Curto Prazo)
- [ ] Loop de seções específicas
- [ ] Velocidade de reprodução (0.5x, 0.75x, 1x, 1.25x, 1.5x)
- [ ] Equalizador por faixa
- [ ] Histórico de prática
- [ ] Favoritos

### 10.3 Fase 3 (Médio Prazo)
- [ ] Gravação de prática do usuário
- [ ] Comparação com faixas originais
- [ ] Anotações pessoais nas letras
- [ ] Compartilhamento de configurações
- [ ] Modo offline (PWA)

### 10.4 Fase 4 (Longo Prazo)
- [ ] IA para análise de performance
- [ ] Sugestões de melhoria
- [ ] Integração com plataformas de streaming
- [ ] Comunidade de prática
- [ ] Certificados de conclusão

---

## 11. Glossário

- **Backing Vocal**: Vocais de apoio que acompanham a voz principal
- **Click Track**: Metrônomo em formato de áudio
- **Faixa Guia**: Faixa de referência usada para sincronização de tempo
- **Howl/Howler.js**: Biblioteca JavaScript para reprodução de áudio
- **Signal**: Primitive reativo do Angular para gerenciamento de estado
- **Timestamp**: Marca de tempo em segundos (com precisão de 3 casas decimais)
- **Tolerância**: Margem de erro aceitável para comparação de timestamps (0.05s)

---

## 12. Anexos

### 12.1 Exemplo de Estrutura de Dados Completa
Ver seção 2.5.4

### 12.2 Código de Referência
- `src/app/domain/backing-practice/pages/song-detail/song-detail.page.ts`
- `src/app/domain/backing-practice/components/audio-player/audio-player.component.ts`
- `src/app/widgets/directives/text-format/text-format.directive.ts`

### 12.3 Dependências do Projeto
```json
{
  "howler": "^2.2.4",
  "@ngzard/ui": "^1.0.0-beta.10",
  "@angular/core": "~18.0.0"
}
```

---

**Documento criado em:** 2024
**Versão:** 1.0
**Autor:** Equipe de Desenvolvimento Musix Studio
