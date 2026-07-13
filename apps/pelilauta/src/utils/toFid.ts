export function toFid(nick: string) {
  return `@${nick.replace(/\s/g, '').toLowerCase()}@pelilauta.social`;
}
