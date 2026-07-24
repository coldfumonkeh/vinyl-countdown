export const VINYL_PLACEHOLDER = '/vinyl-placeholder.svg'

export function recordThumbUrl(thumb) {
  if (!thumb || thumb.trim() === '') {
    return VINYL_PLACEHOLDER
  }

  return thumb
}

export function onThumbError(event) {
  if (event.target.src.endsWith(VINYL_PLACEHOLDER)) {
    return
  }

  event.target.src = VINYL_PLACEHOLDER
}
