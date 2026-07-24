let cachedCollection = null

export async function loadCollection() {
  if (cachedCollection) {
    return cachedCollection
  }

  const response = await fetch('/collection.json')

  if (!response.ok) {
    throw new Error('Failed to load collection')
  }

  cachedCollection = await response.json()
  return cachedCollection
}

export function getRecordById(collection, id) {
  return collection.records.find(record => String(record.id) === String(id))
}
