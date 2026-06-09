import { createHash } from 'crypto'

export function hashPassword(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}
