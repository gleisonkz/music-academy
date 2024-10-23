export interface Question {
  id: number;
  question: string;
  answer: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Timbre',
    answer: 'A Identidade de um som',
  },
  {
    id: 2,
    question: 'Intervalo',
    answer: 'A medida usada para calcular a distância entre duas notas.',
  },
  {
    id: 3,
    question: 'Enarmonia',
    answer: 'Nomes diferentes para um mesmo som.',
  },
  {
    id: 4,
    question: 'Oitava',
    answer: 'É o intervalo entre duas notas de mesmo nome, onde a segunda nota é mais aguda ou mais grave que a primeira.',
  },
  {
    id: 5,
    question: 'Em qual oitava fica o C central?',
    answer: '4ª oitava.',
  },
  {
    id: 6,
    question: 'Escala',
    answer: 'É uma sequência de notas de nomes diferentes, dentro de uma mesma oitava, separadas por um padrão de intervalos.',
  },
  {
    id: 7,
    question: 'Acorde',
    answer: 'Emissão de duas ou mais notas ao mesmo tempo.',
  },
  {
    id: 8,
    question: 'Uníssono Pleno',
    answer: 'Duas ou mais pessoas cantando a mesma nota na mesma oitava.',
  },
  {
    id: 9,
    question: 'Uníssono Oitavado',
    answer: 'Duas ou mais pessoas cantando a mesma nota em oitavas diferentes.',
  },
  {
    id: 10,
    question: 'Melodia',
    answer: 'Duas ou mais notas emitidas uma após a outra/sucessivamente.',
  },
  {
    id: 11,
    question: 'Harmonia',
    answer: 'Sequência de acordes que serve como base para uma melodia.',
  },
  {
    id: 12,
    question: 'Divisão Vocal/ Abertura de Vozes',
    answer: 'Duas ou mais vozes cantando melodias diferentes que se harmonizam.',
  },
  {
    id: 13,
    question: 'Extensão Vocal',
    answer:
      'É o intervalo de notas desde a nota mais grave até a nota mais aguda emitida por uma pessoa, independentemente da QUALIDADE dessa emissão.',
  },
  {
    id: 14,
    question: 'Tessitura Vocal',
    answer: 'É o intervalo de notas desde a nota mais grave até a nota mais aguda emitida por uma pessoa com QUALIDADE na emissão.',
  },
  {
    id: 15,
    question: 'Naipe',
    answer: 'Classificação Vocal, ex: Tenor, Contralto, Soprano.',
  },
  {
    id: 16,
    question: 'Dobra de Naipes',
    answer: 'Inversão de vozes.',
  },
  {
    id: 17,
    question: 'Semi-tom / Meio tom',
    answer: 'O menor intervalo entre duas notas.',
  },
  {
    id: 18,
    question: 'Tom',
    answer: 'A soma de dois semitons.',
  },
  {
    id: 19,
    question: 'Quantas são as notas naturais?',
    answer: '7',
  },
  {
    id: 20,
    question: 'Notas Naturais Ascendentes',
    answer: 'C D E F G A B C',
  },
  {
    id: 21,
    question: 'Notas Naturais Descendentes',
    answer: 'C B A G F E D C',
  },
  {
    id: 22,
    question: 'Quantas notas existem ao todo na música?',
    answer: '12',
  },
  {
    id: 23,
    question: 'Escala Cromática Ascendente com #',
    answer: 'C C# D D# E F F# G G# A A# B C',
  },
  {
    id: 24,
    question: 'Escala Cromática Descendente com #',
    answer: 'C B A# A G# G F# F E D# D C# C',
  },
  {
    id: 25,
    question: 'Escala Cromática Ascendente com bemol',
    answer: 'C Db D Eb E F Gb G Ab A Bb B C',
  },
  {
    id: 26,
    question: 'Escala Cromática Descendente com bemol',
    answer: 'C B Bb A Ab G Gb F E Eb D Db C',
  },
  {
    id: 27,
    question: 'Qual a forma da escala maior?',
    answer: 'T, T, sT, T, T, T, St',
  },
];
