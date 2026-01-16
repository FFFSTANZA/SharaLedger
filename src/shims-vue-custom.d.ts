import { Fyo } from 'fyo';
import { TranslationLiteral } from 'fyo/utils/translation';
import { IPC } from 'main/preload';

declare module 'vue' {
  interface ComponentCustomProperties {
    t: (...args: TranslationLiteral[]) => string;
    fyo: Fyo;
    platform: 'Windows' | 'Linux' | 'Mac';
    ipc: IPC;
  }
}
