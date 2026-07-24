#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const DISCOGS_API = 'https://api.discogs.com'
const USER_AGENT = 'VinylCountdown/1.0 +https://github.com/coldfumonkeh/vinyl-countdown'
const REQUEST_DELAY_MS = 2000
const MAX_RETRIES = 5

const token = (process.env.DISCOGS_TOKEN || '').trim()
const username = (process.env.DISCOGS_USERNAME || 'coldfumonkeh').trim()

if (!token) {
  console.error('DISCOGS_TOKEN environment variable is required')
  process.exit(1)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function discogsFetch(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${token}`,
      'User-Agent': USER_AGENT
    }
  })

  if (response.status === 429 && attempt <= MAX_RETRIES) {
    const retryAfter = Number.parseInt(response.headers.get('Retry-After') || '60', 10)
    console.warn(`Rate limited. Waiting ${retryAfter}s before retry ${attempt}/${MAX_RETRIES}...`)
    await sleep(retryAfter * 1000)
    return discogsFetch(url, attempt + 1)
  }

  if (response.status >= 500 && attempt <= MAX_RETRIES) {
    const backoff = attempt * 5
    console.warn(`Server error ${response.status}. Retrying in ${backoff}s...`)
    await sleep(backoff * 1000)
    return discogsFetch(url, attempt + 1)
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Discogs API error ${response.status} for ${url}: ${body}`)
  }

  return response.json()
}

async function fetchCollectionItems() {
  const items = []
  let page = 1
  let pages = 1

  while (page <= pages) {
    const url = `${DISCOGS_API}/users/${username}/collection/folders/0/releases?per_page=100&page=${page}`
    const data = await discogsFetch(url)
    pages = data.pagination.pages
    items.push(...data.releases)

    console.log(`Fetched collection page ${page}/${pages} (${items.length} releases so far)`)
    page += 1

    if (page <= pages) {
      await sleep(REQUEST_DELAY_MS)
    }
  }

  return items
}

function formatReleased(release) {
  if (release.released) {
    return release.released
  }

  if (release.year) {
    return String(release.year)
  }

  return null
}

function normalizeFromBasicInformation(basic) {
  const artistsSort = (basic.artists || []).map(artist => artist.name).join(', ')

  return {
    id: basic.id,
    title: basic.title,
    artists: basic.artists || [],
    artists_sort: artistsSort,
    thumb: basic.thumb,
    genres: basic.genres || [],
    labels: basic.labels || [],
    tracklist: [],
    released_formatted: basic.year ? String(basic.year) : null,
    searchText: `${basic.title}${artistsSort}`.toLowerCase()
  }
}

function normalizeRelease(release) {
  const artistsSort = release.artists_sort || (release.artists || []).map(a => a.name).join(', ')

  return {
    id: release.id,
    title: release.title,
    artists: release.artists || [],
    artists_sort: artistsSort,
    thumb: release.thumb,
    genres: release.genres || [],
    labels: release.labels || [],
    tracklist: release.tracklist || [],
    released_formatted: formatReleased(release),
    searchText: `${release.title}${artistsSort}`.toLowerCase()
  }
}

async function fetchReleaseDetails(releaseId) {
  const url = `${DISCOGS_API}/releases/${releaseId}`
  const release = await discogsFetch(url)
  return normalizeRelease(release)
}

async function main() {
  console.log(`Syncing Discogs collection for user: ${username}`)

  try {
    await discogsFetch(`${DISCOGS_API}/users/${username}`)
    console.log('Discogs authentication OK')
  } catch (error) {
    throw new Error(`Discogs authentication failed for user "${username}". Check DISCOGS_TOKEN and DISCOGS_USERNAME secrets. ${error.message}`)
  }

  const collectionItems = await fetchCollectionItems()
  const records = []
  let failedCount = 0

  for (let i = 0; i < collectionItems.length; i += 1) {
    const releaseId = collectionItems[i].basic_information.id
    const fallbackRecord = normalizeFromBasicInformation(collectionItems[i].basic_information)

    try {
      const record = await fetchReleaseDetails(releaseId)
      records.push(record)
      console.log(`Fetched release ${i + 1}/${collectionItems.length}: ${record.title}`)
    } catch (error) {
      failedCount += 1
      records.push(fallbackRecord)
      console.warn(`Using basic info for release ${releaseId}: ${error.message}`)
    }

    if (i < collectionItems.length - 1) {
      await sleep(REQUEST_DELAY_MS)
    }
  }

  const output = {
    syncedAt: new Date().toISOString(),
    username,
    totalRecords: records.length,
    records
  }

  const outputPath = path.join(__dirname, '..', 'public', 'collection.json')
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`Wrote ${records.length} records to ${outputPath}`)

  if (failedCount > 0) {
    console.warn(`${failedCount} release(s) used basic information only (tracklist may be missing).`)
  }
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
