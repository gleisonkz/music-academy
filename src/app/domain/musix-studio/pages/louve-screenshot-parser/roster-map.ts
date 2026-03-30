export interface LouveRoleEntry {
  output: string;
  aliases: string[];
}

export type LouveRosterMap = Record<string, LouveRoleEntry[]>;

export const LOUVE_ROSTER_MAP: LouveRosterMap = {
  ministros: [
    { output: '🎙️ - @matheusvinp', aliases: ['matheus', 'matheus vinicius'] },
    { output: '🎙️ - @dudu_eduardolima', aliases: ['eduardo lima', 'eduardo', 'dudu'] },
    { output: '🎙️ - @danielthomaaz', aliases: ['daniel thomaz', 'daniel'] },
    { output: '🎙️ - @amanda.souzzaoficcial', aliases: ['amanda souza', 'amanda'] },
    { output: '🎙️ - @visthef', aliases: ['vidriele stefani', 'sthef', 'vi sthef', 'vidriele'] },
    { output: '🎙️ - @kawenymendes', aliases: ['kaweny', 'kaweny mendes'] },
    { output: '🎙️ - @thomaz_danih', aliases: ['daniela thomaz', 'daniela', 'dani'] },
  ],
  tenor: [
    { output: '🎤 - @dudu_eduardolima', aliases: ['eduardo lima', 'eduardo', 'dudu'] },
    { output: '🎤 - @danielthomaaz', aliases: ['daniel thomaz', 'daniel'] },
    { output: '🎤 - @luizgsantana_', aliases: ['luiz', 'luiz gustavo', 'luiz santana'] },
    { output: '🎤 - @eucaio_fe', aliases: ['caio felipe', 'caio'] },
  ],
  contralto: [
    { output: '🎤 - @_rebecada', aliases: ['rebeca rodrigues', 'rebeca'] },
    { output: '🎤 - @eumelisilva', aliases: ['melissa silva', 'melissa', 'meli silva'] },
    { output: '🎤 - @visthef', aliases: ['vidriele stefani', 'sthef', 'vi sthef', 'vidriele'] },
    { output: '🎤 - @sophstephani', aliases: ['sophia stephani', 'sophia', 'sophstephani'] },
  ],
  soprano: [
    { output: '🎤 - @thomaz_danih', aliases: ['daniela thomaz', 'daniela', 'dani'] },
    { output: '🎤 - @samyraferrari05', aliases: ['samyra ferrari', 'samyra'] },
    { output: '🎤 - @kawenymendes', aliases: ['kaweny', 'kaweny mendes'] },
    { output: '🎤 - @jhenis.monteiro', aliases: ['jhenis monteiro', 'jhenis', 'jennifer eduarda', 'jennifer'] },
  ],
  baixo: [
    { output: '🎸 - @gleison_kz', aliases: ['gleison'] },
    { output: '🎸 - @_pablohenriquue', aliases: ['pablo henrique', 'pablo'] },
    { output: '🎸 - @rubens_juninhos', aliases: ['rubens junior', 'rubens'] },
  ],
  guitarra: [
    { output: '🎸 - @gleison_kz', aliases: ['gleison'] },
    { output: '🎸 - @matheusvinp', aliases: ['matheus', 'matheus vinicius'] },
    { output: '🎸 - @ggomesjoao_', aliases: ['joao', 'joao gomes', 'joao lucas gomes'] },
    { output: '🎸 - @mah_rd', aliases: ['mauricio', 'mah'] },
  ],
  teclado: [
    { output: '🎹 - @gleison_kz', aliases: ['gleison'] },
    { output: '🎹 - @_guiosilva', aliases: ['gui', 'guilherme silva', 'gustavo silva'] },
  ],
  violao: [
    { output: '🪕 - @gustavo.moreira__', aliases: ['gustavo moreira', 'gustavo'] },
    { output: '🪕 - @william_fernandes303', aliases: ['willian de almeida fernandes', 'willian', 'william'] },
    { output: '🪕 - @sophstephani', aliases: ['sophia stephani', 'sophia', 'sophstephani'] },
    { output: '🪕 - @josewellingtn', aliases: ['jose wellington', 'jose'] },
  ],
  bateria: [
    { output: '🥁 - @luhgodines', aliases: ['luh', 'luh godines'] },
    { output: '🥁 - @ademarsnt', aliases: ['ademar', 'ademarsnt', 'ademar goncalves campos', 'goncalves campos'] },
    { output: '🥁 - @hugo_perecin', aliases: ['hugo perecin', 'hugo'] },
    { output: '🥁 - @_medeiro.xs', aliases: ['gabriel medeiros', 'medeiros', 'gabriel'] },
    { output: '🥁 - Pedro', aliases: ['pedro', 'pedro fontes'] },
  ],
};

export const IGNORE_ROLE_TERMS = ['mesa de som'];
