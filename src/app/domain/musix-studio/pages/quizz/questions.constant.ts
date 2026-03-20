export interface Question {
  question: string;
  answer: string;
  /** Quando true, a UI deve priorizar imagem e reduzir texto grande. */
  imageOnly?: boolean;
  /** Opcional: SVG de figura a mostrar no card (Estudar) ou no flip (Praticar). */
  questionImageSrc?: string;
  /** Opcional: SVG de figura a mostrar no verso (Praticar) ou abaixo da pergunta (Estudar). */
  answerImageSrc?: string;
  /** Tags para filtrar (ex.: "Backing Vocal", "Instrumento"). Cada pergunta pode ter várias. */
  tags?: string[];
}

/** Tags disponíveis para categorizar perguntas. */
export const QUIZ_TAGS = ['Backing Vocal', 'Instrumento', 'Ritmo'] as const;

export const QUESTIONS: Question[] = [
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Nota',
    answer: 'A emissão de um único som.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Quais são as propriedades de um som?',
    answer: 'Altura, Intensidade, Duração e Timbre.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Altura',
    answer: 'Indica se o som é grave, médio ou agudo. (frequência, medida em Hertz (Hz)).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Intensidade',
    answer: 'Indica se o som é forte ou fraco (volume, medida em decibéis (dB)).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Duração',
    answer: 'Indica o tempo que o som dura. (duração, medida em segundos (s)).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Timbre',
    answer:
      'A Identidade de um som. (características sonoras que permitem distinguir um instrumento de outro, mesmo que emitam a mesma nota na mesma altura e intensidade.)',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Quantas são as notas naturais?',
    answer: '7',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Notas Naturais Ascendentes',
    answer: 'C D E F G A B C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Notas Naturais Descendentes',
    answer: 'C B A G F E D C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Acidente',
    answer: 'Símbolo que modifica a altura de uma nota.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Quantas notas existem ao todo na música?',
    answer: '12',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Intervalo',
    answer: 'A medida usada para calcular a distância entre duas notas.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Semi-tom / Meio tom',
    answer: 'O menor intervalo entre duas notas.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tom',
    answer: 'A soma de dois semitons.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Enarmonia',
    answer: 'Nomes diferentes para um mesmo som.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Acorde',
    answer: 'Emissão de duas ou mais notas ao mesmo tempo.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Melodia',
    answer: 'Duas ou mais notas emitidas uma após a outra/sucessivamente.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Harmonia',
    answer: 'Sequência de acordes que serve como base para uma melodia.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Oitava',
    answer: 'É o intervalo entre duas notas de mesmo nome, onde a segunda nota é mais aguda ou mais grave que a primeira.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Em qual oitava fica o C central?',
    answer: '4ª oitava.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala',
    answer: 'É uma sequência de notas de nomes diferentes, dentro de uma mesma oitava, separadas por um padrão de intervalos.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Qual é a fórmula da escala maior?',
    answer: 'T, T, sT, T, T, T, St',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Qual é a fórmula da escala cromática?',
    answer: 'st, st, st, st, st, st, st, st, st, st, st, st',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Uníssono Pleno',
    answer: 'Duas ou mais pessoas cantando a mesma nota na mesma oitava.',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Uníssono Oitavado',
    answer: 'Duas ou mais pessoas cantando a mesma nota em oitavas diferentes.',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Divisão Vocal/ Abertura de Vozes',
    answer: 'Duas ou mais vozes cantando melodias diferentes que se harmonizam.',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Extensão Vocal',
    answer:
      'É o intervalo de notas desde a nota mais grave até a nota mais aguda emitida por uma pessoa, independentemente da QUALIDADE dessa emissão.',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Tessitura Vocal',
    answer: 'É o intervalo de notas desde a nota mais grave até a nota mais aguda emitida por uma pessoa com QUALIDADE na emissão.',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Naipe',
    answer: 'Classificação Vocal, ex: Tenor, Contralto, Soprano.',
  },
  {
    tags: ['Backing Vocal'],
    question: 'Dobra de Naipes',
    answer: 'Inversão de vozes.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de C',
    answer: 'C D E F G A B C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de Db',
    answer: `Db Eb F Gb Ab Bb C Db`,
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de D',
    answer: 'D E F# G A B C# D',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de Eb',
    answer: 'Eb F G Ab Bb C D Eb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de E',
    answer: 'E F# G# A B C# D# E',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de F',
    answer: 'F G A Bb C D E F',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de F#',
    answer: 'F# G# A# B C# D# E# F#',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de G',
    answer: 'G A B C D E F# G',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de Ab',
    answer: 'Ab Bb C Db Eb F G Ab',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de A',
    answer: 'A B C# D E F# G# A',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de Bb',
    answer: 'Bb C D Eb F G A Bb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Maior de B',
    answer: 'B C# D# E F# G# A# B',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tipos de Tríades',
    answer: 'Maior, Menor, Diminuta, Aumentada, sus2, sus4.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tríade Maior',
    answer: 'É um acorde formado por três notas. T (tônica), 3 (terça maior), 5 (quinta justa).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tríade Menor',
    answer: 'É um acorde formado por três notas. T (tônica), 3b (terça menor), 5 (quinta justa).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tríade Diminuta',
    answer: 'É um acorde formado por três notas. T (tônica), 3b (terça menor), 5b (quinta diminuta).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tríade Aumentada',
    answer: 'É um acorde formado por três notas. T (tônica), 3 (terça maior), 5# (quinta aumentada).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tríade sus2',
    answer: 'É um acorde formado por três notas. T (tônica), 2 (segunda maior), 5 (quinta justa).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tríade sus4',
    answer: 'É um acorde formado por três notas. T (tônica), 4 (quarta justa), 5 (quinta justa).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Tétrade',
    answer: 'É um acorde formado por quatro ou mais notas. T (tônica), 3 (terça maior), 5 (quinta justa), 7 (sétima maior).',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Um intervalo de segunda pode ser classificado como:',
    answer: 'Maior, Menor',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Um intervalo de terça pode ser classificado como:',
    answer: 'Maior, Menor',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Um intervalo de quarta pode ser classificado como:',
    answer: 'Justa, Aumentada, Diminuta',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Um intervalo de quinta pode ser classificado como:',
    answer: 'Justa, Aumentada, Diminuta',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Um intervalo de sexta pode ser classificado como:',
    answer: 'Maior, Menor',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Um intervalo de sétima pode ser classificado como:',
    answer: 'Maior, Menor, Diminuta',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Cromática Ascendente com #',
    answer: 'C C# D D# E F F# G G# A A# B C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Cromática Descendente com #',
    answer: 'C B A# A G# G F# F E D# D C# C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Cromática Ascendente com bemol',
    answer: 'C Db D Eb E F Gb G Ab A Bb B C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Escala Cromática Descendente com bemol',
    answer: 'C B Bb A Ab G Gb F E Eb D Db C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Qual a diferença entre a tríade maior e a tríade menor?',
    answer: 'A diferença está no 3º grau, que na tríade maior é uma 3ª maior e na tríade menor é uma 3ª menor.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Qual a diferença entre a tríade maior e a tríade aumentada?',
    answer: 'A diferença está no 5º grau, que na tríade maior é uma 5ª justa e na tríade aumentada é uma 5ª aumentada.',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota C, qual a nota resultante?',
    answer: 'D',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota C#, qual a nota resultante?',
    answer: 'D# ou Eb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota Db, qual a nota resultante?',
    answer: 'Eb ou D#',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota D#, qual a nota resultante?',
    answer: 'F',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota Eb, qual a nota resultante?',
    answer: 'F',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota E, qual a nota resultante?',
    answer: 'Gb ou F#',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota F, qual a nota resultante?',
    answer: 'G',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota F#, qual a nota resultante?',
    answer: 'G# ou Ab',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota Gb, qual a nota resultante?',
    answer: 'Ab ou G#',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota G, qual a nota resultante?',
    answer: 'A',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota G#, qual a nota resultante?',
    answer: 'A# ou Bb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota Ab, qual a nota resultante?',
    answer: 'Bb ou A#',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota A, qual a nota resultante?',
    answer: 'B',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota A#, qual a nota resultante?',
    answer: 'C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota Bb, qual a nota resultante?',
    answer: 'C',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em um tom a nota B, qual a nota resultante?',
    answer: 'C# ou Db',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota C, qual a nota resultante?',
    answer: 'C# ou Db',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota C#, qual a nota resultante?',
    answer: 'D',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota Db, qual a nota resultante?',
    answer: 'D',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota D, qual a nota resultante?',
    answer: 'D# ou Eb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota D#, qual a nota resultante?',
    answer: 'E',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota Eb, qual a nota resultante?',
    answer: 'E',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota E, qual a nota resultante?',
    answer: 'F',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota F, qual a nota resultante?',
    answer: 'F# ou Gb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota F#, qual a nota resultante?',
    answer: 'G',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota Gb, qual a nota resultante?',
    answer: 'G',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota G, qual a nota resultante?',
    answer: 'G# ou Ab',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota G#, qual a nota resultante?',
    answer: 'A',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota Ab, qual a nota resultante?',
    answer: 'A',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota A, qual a nota resultante?',
    answer: 'A# ou Bb',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota A#, qual a nota resultante?',
    answer: 'B',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota Bb, qual a nota resultante?',
    answer: 'B',
  },
  {
    tags: ['Backing Vocal', 'Instrumento'],
    question: 'Aumentando em meio tom a nota B, qual a nota resultante?',
    answer: 'C',
  },
  // ----------------------------
  // Ritmo (Nome das figuras)
  // ----------------------------
  {
    tags: ['Ritmo'],
    imageOnly: true,
    question: 'Qual o nome da figura?',
    answer: 'Semibreve',
    questionImageSrc: '/assets/figures/whole-note.svg',
    answerImageSrc: '/assets/figures/whole-note.svg',
  },
  {
    tags: ['Ritmo'],
    imageOnly: true,
    question: 'Qual o nome da figura?',
    answer: 'Mínima',
    questionImageSrc: '/assets/figures/half-note.svg',
    answerImageSrc: '/assets/figures/half-note.svg',
  },
  {
    tags: ['Ritmo'],
    imageOnly: true,
    question: 'Qual o nome da figura?',
    answer: 'Semínima',
    questionImageSrc: '/assets/figures/quarter-note.svg',
    answerImageSrc: '/assets/figures/quarter-note.svg',
  },
  {
    tags: ['Ritmo'],
    imageOnly: true,
    question: 'Qual o nome da figura?',
    answer: 'Colcheia',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/eighth-note.svg',
  },
  {
    tags: ['Ritmo'],
    imageOnly: true,
    question: 'Qual o nome da figura?',
    answer: 'Semicolcheia',
    questionImageSrc: '/assets/figures/sixteenth-note.svg',
    answerImageSrc: '/assets/figures/sixteenth-note.svg',
  },
  {
    tags: ['Ritmo'],
    imageOnly: true,
    question: 'Qual o nome da figura?',
    answer: 'Semínima pontuada',
    questionImageSrc: '/assets/figures/dotted-quarter-note.svg',
    answerImageSrc: '/assets/figures/dotted-quarter-note.svg',
  },
  // ----------------------------
  // Ritmo (Figuras Rítmicas)
  // Foco: 4/4 e 6/8
  // ----------------------------
  {
    tags: ['Ritmo'],
    question: 'O que é a semínima (figura rítmica) em 4/4?',
    answer: 'Em 4/4, a semínima vale 1 tempo (1 pulso).',
    questionImageSrc: '/assets/figures/quarter-note.svg',
    answerImageSrc: '/assets/figures/quarter-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 4/4, quantas semínimas cabem em 1 compasso?',
    answer: '4 semínimas por compasso.',
    questionImageSrc: '/assets/figures/quarter-note.svg',
    answerImageSrc: '/assets/figures/quarter-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 4/4, quanto vale uma mínima?',
    answer: 'Uma mínima vale 2 tempos.',
    questionImageSrc: '/assets/figures/half-note.svg',
    answerImageSrc: '/assets/figures/half-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 4/4, quanto vale uma semibreve?',
    answer: 'Uma semibreve vale 4 tempos.',
    questionImageSrc: '/assets/figures/whole-note.svg',
    answerImageSrc: '/assets/figures/whole-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'O que é a colcheia em 4/4?',
    answer: 'Em 4/4, a colcheia vale 1/2 tempo. Duas colcheias completam 1 tempo.',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/eighth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 4/4, quantas colcheias cabem em 1 tempo?',
    answer: '2 colcheias por tempo.',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/eighth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 4/4, quantas semicolcheias cabem em 1 tempo?',
    answer: '4 semicolcheias por tempo.',
    questionImageSrc: '/assets/figures/sixteenth-note.svg',
    answerImageSrc: '/assets/figures/sixteenth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 4/4, qual é a relação de duração entre 2 colcheias e 1 semínima?',
    answer: '2 colcheias têm a mesma duração de 1 semínima.',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/quarter-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'O que significa a contagem “1 e 2 e 3 e 4 e” (em 4/4)?',
    answer: 'A contagem de 1 a 4 indica os tempos (semínimas) e o “e” divide cada tempo em 2 partes iguais (colcheias).',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, qual figura representa o pulso principal (tempo) do compasso?',
    answer: 'Em 6/8, o pulso principal é a semínima pontuada: ela vale 3 colcheias.',
    questionImageSrc: '/assets/figures/dotted-quarter-note.svg',
    answerImageSrc: '/assets/figures/dotted-quarter-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, quantas colcheias existem por compasso?',
    answer: '6 colcheias por compasso.',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/eighth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, quantas colcheias existem por tempo (pulso principal)?',
    answer: '3 colcheias por tempo (3+3).',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/dotted-quarter-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, como normalmente se organizam as colcheias na contagem?',
    answer: 'Em dois grupos de 3: 1-2-3 (tempo 1) e 4-5-6 (tempo 2).',
    questionImageSrc: '/assets/figures/eighth-note.svg',
    answerImageSrc: '/assets/figures/eighth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, quanto vale uma semínima (1/4) em colcheias?',
    answer: '1 semínima = 2 colcheias.',
    questionImageSrc: '/assets/figures/quarter-note.svg',
    answerImageSrc: '/assets/figures/eighth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, quantas semicolcheias existem por compasso?',
    answer: '12 semicolcheias por compasso.',
    questionImageSrc: '/assets/figures/sixteenth-note.svg',
    answerImageSrc: '/assets/figures/sixteenth-note.svg',
  },
  {
    tags: ['Ritmo'],
    question: 'Em 6/8, quantas semicolcheias existem por tempo?',
    answer: '6 semicolcheias por tempo (porque 1 tempo = 3 colcheias = 6 semicolcheias).',
    questionImageSrc: '/assets/figures/sixteenth-note.svg',
    answerImageSrc: '/assets/figures/dotted-quarter-note.svg',
  },
];
