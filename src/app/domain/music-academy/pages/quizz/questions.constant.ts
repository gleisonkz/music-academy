export interface Question {
  question: string;
  answer: string;
}

export const QUESTIONS: Question[] = [
  {
    question: 'Nota',
    answer: 'A emissão de um único som.',
  },
  {
    question: 'Intervalo',
    answer: 'A medida usada para calcular a distância entre duas notas.',
  },
  {
    question: 'Semi-tom / Meio tom',
    answer: 'O menor intervalo entre duas notas.',
  },
  {
    question: 'Tom',
    answer: 'A soma de dois semitons.',
  },
  {
    question: 'Timbre',
    answer: 'A Identidade de um som',
  },
  {
    question: 'Enarmonia',
    answer: 'Nomes diferentes para um mesmo som.',
  },
  {
    question: 'Oitava',
    answer: 'É o intervalo entre duas notas de mesmo nome, onde a segunda nota é mais aguda ou mais grave que a primeira.',
  },
  {
    question: 'Em qual oitava fica o C central?',
    answer: '4ª oitava.',
  },
  {
    question: 'Escala',
    answer: 'É uma sequência de notas de nomes diferentes, dentro de uma mesma oitava, separadas por um padrão de intervalos.',
  },
  {
    question: 'Qual a forma da escala maior?',
    answer: 'T, T, sT, T, T, T, St',
  },
  {
    question: 'Aumentando em um tom a nota C, qual a nota resultante?',
    answer: 'D',
  },
  {
    question: 'Aumentando em um tom a nota C#, qual a nota resultante?',
    answer: 'D#',
  },
  {
    question: 'Aumentando em um tom a nota Db, qual a nota resultante?',
    answer: 'Eb',
  },
  {
    question: 'Aumentando em um tom a nota D#, qual a nota resultante?',
    answer: 'F',
  },
  {
    question: 'Aumentando em um tom a nota Eb, qual a nota resultante?',
    answer: 'F',
  },
  {
    question: 'Aumentando em um tom a nota E, qual a nota resultante?',
    answer: 'Gb ou F#',
  },
  {
    question: 'Aumentando em um tom a nota F, qual a nota resultante?',
    answer: 'G',
  },
  {
    question: 'Aumentando em um tom a nota F#, qual a nota resultante?',
    answer: 'G#',
  },
  {
    question: 'Aumentando em um tom a nota Gb, qual a nota resultante?',
    answer: 'Ab',
  },
  {
    question: 'Aumentando em um tom a nota G, qual a nota resultante?',
    answer: 'A',
  },
  {
    question: 'Aumentando em um tom a nota G#, qual a nota resultante?',
    answer: 'A#',
  },
  {
    question: 'Aumentando em um tom a nota Ab, qual a nota resultante?',
    answer: 'Bb',
  },
  {
    question: 'Aumentando em um tom a nota A, qual a nota resultante?',
    answer: 'B',
  },
  {
    question: 'Aumentando em um tom a nota A#, qual a nota resultante?',
    answer: 'C',
  },
  {
    question: 'Aumentando em um tom a nota Bb, qual a nota resultante?',
    answer: 'C',
  },
  {
    question: 'Aumentando em um tom a nota B, qual a nota resultante?',
    answer: 'C#',
  },
  {
    question: 'Aumentando em meio tom a nota C, qual a nota resultante?',
    answer: 'C# ou Db',
  },
  {
    question: 'Aumentando em meio tom a nota C#, qual a nota resultante?',
    answer: 'D',
  },
  {
    question: 'Aumentando em meio tom a nota Db, qual a nota resultante?',
    answer: 'D',
  },
  {
    question: 'Aumentando em meio tom a nota D, qual a nota resultante?',
    answer: 'D# ou Eb',
  },
  {
    question: 'Aumentando em meio tom a nota D#, qual a nota resultante?',
    answer: 'E',
  },
  {
    question: 'Aumentando em meio tom a nota Eb, qual a nota resultante?',
    answer: 'E',
  },
  {
    question: 'Aumentando em meio tom a nota E, qual a nota resultante?',
    answer: 'F',
  },
  {
    question: 'Aumentando em meio tom a nota F, qual a nota resultante?',
    answer: 'F# ou Gb',
  },
  {
    question: 'Aumentando em meio tom a nota F#, qual a nota resultante?',
    answer: 'G',
  },
  {
    question: 'Aumentando em meio tom a nota Gb, qual a nota resultante?',
    answer: 'G',
  },
  {
    question: 'Aumentando em meio tom a nota G, qual a nota resultante?',
    answer: 'G# ou Ab',
  },
  {
    question: 'Aumentando em meio tom a nota G#, qual a nota resultante?',
    answer: 'A',
  },
  {
    question: 'Aumentando em meio tom a nota Ab, qual a nota resultante?',
    answer: 'A',
  },
  {
    question: 'Aumentando em meio tom a nota A, qual a nota resultante?',
    answer: 'A# ou Bb',
  },
  {
    question: 'Aumentando em meio tom a nota A#, qual a nota resultante?',
    answer: 'B',
  },
  {
    question: 'Aumentando em meio tom a nota Bb, qual a nota resultante?',
    answer: 'B',
  },
  {
    question: 'Aumentando em meio tom a nota B, qual a nota resultante?',
    answer: 'C',
  },
  {
    question: 'Escala Maior de C',
    answer: 'C D E F G A B C',
  },
  {
    question: 'Escala Maior de D',
    answer: 'D E F# G A B C# D',
  },
  {
    question: 'Escala Maior de E',
    answer: 'E F# G# A B C# D# E',
  },
  {
    question: 'Escala Maior de F',
    answer: 'F G A Bb C D E F',
  },
  {
    question: 'Escala Maior de G',
    answer: 'G A B C D E F# G',
  },
  {
    question: 'Escala Maior de A',
    answer: 'A B C# D E F# G# A',
  },
  {
    question: 'Escala Maior de B',
    answer: 'B C# D# E F# G# A# B',
  },
  {
    question: 'Acorde',
    answer: 'Emissão de duas ou mais notas ao mesmo tempo.',
  },
  {
    question: 'Tríade Maior',
    answer: 'Acorde formado por três notas. T, 3, 5.',
  },
  {
    question: 'Tétrade',
    answer: 'Acorde formado por quatro notas. T, 3, 5, 7.',
  },
  {
    question: 'Tipos de Tríades',
    answer: 'Maior, Menor, Diminuta, Aumentada.',
  },
  {
    question: 'Uníssono Pleno',
    answer: 'Duas ou mais pessoas cantando a mesma nota na mesma oitava.',
  },
  {
    question: 'Uníssono Oitavado',
    answer: 'Duas ou mais pessoas cantando a mesma nota em oitavas diferentes.',
  },
  {
    question: 'Melodia',
    answer: 'Duas ou mais notas emitidas uma após a outra/sucessivamente.',
  },
  {
    question: 'Harmonia',
    answer: 'Sequência de acordes que serve como base para uma melodia.',
  },
  {
    question: 'Divisão Vocal/ Abertura de Vozes',
    answer: 'Duas ou mais vozes cantando melodias diferentes que se harmonizam.',
  },
  {
    question: 'Extensão Vocal',
    answer:
      'É o intervalo de notas desde a nota mais grave até a nota mais aguda emitida por uma pessoa, independentemente da QUALIDADE dessa emissão.',
  },
  {
    question: 'Tessitura Vocal',
    answer: 'É o intervalo de notas desde a nota mais grave até a nota mais aguda emitida por uma pessoa com QUALIDADE na emissão.',
  },
  {
    question: 'Naipe',
    answer: 'Classificação Vocal, ex: Tenor, Contralto, Soprano.',
  },
  {
    question: 'Dobra de Naipes',
    answer: 'Inversão de vozes.',
  },
  {
    question: 'Quantas são as notas naturais?',
    answer: '7',
  },
  {
    question: 'Notas Naturais Ascendentes',
    answer: 'C D E F G A B C',
  },
  {
    question: 'Notas Naturais Descendentes',
    answer: 'C B A G F E D C',
  },
  {
    question: 'Quantas notas existem ao todo na música?',
    answer: '12',
  },
  {
    question: 'Escala Cromática Ascendente com #',
    answer: 'C C# D D# E F F# G G# A A# B C',
  },
  {
    question: 'Escala Cromática Descendente com #',
    answer: 'C B A# A G# G F# F E D# D C# C',
  },
  {
    question: 'Escala Cromática Ascendente com bemol',
    answer: 'C Db D Eb E F Gb G Ab A Bb B C',
  },
  {
    question: 'Escala Cromática Descendente com bemol',
    answer: 'C B Bb A Ab G Gb F E Eb D Db C',
  },
];
