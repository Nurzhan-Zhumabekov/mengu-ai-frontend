import type { en } from './en'

export { en } from './en'
export { ru } from './ru'
export { kk } from './kk'

export type TranslationKey = keyof typeof en
export type TranslationDict = typeof en
