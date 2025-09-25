// No-op helper used to mark pages as statically renderable without relying on next-intl/server
export function enableStaticRendering(locale: string = 'uz') {
  return locale
}
