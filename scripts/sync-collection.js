#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const DISCOGS_API = 'https://api.discogs.com'
const USER_AGENT = 'VinylCountdown/1.0 +https://github.com/coldfumonkeh/vinyl-countdown'
const REQUEST_DELAY_MS = 1200
const MAX_RETRIES = 3

const token = (process.env.DISCOGS_TOKEN || '').trim()
const username = (process.env.DISCOGS_USERNAME || 'coldfumonkeh').trim()
const includeTracklists = process.env.SYNC_INCLUDE_TRACKLISTS === 'true'

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
    const backoff = attempt * 3
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

function normalizeFromCollectionItem(item) {
  const basic = item.basic_information
  const artistsSort = (basic.artists || []).map(artist => artist.name).join(', ')

  return {
    instanceId: item.instance_id || item.id,
    id: basic.id,
    title: basic.title,
    artists: basic.artists || [],
    artists_sort: artistsSort,
    thumb: basic.thumb,
    genres: basic.genres || [],
    styles: basic.styles || [],
    labels: basic.labels || [],
    tracklist: [],
    released_formatted: basic.year ? String(basic.year) : null,
    searchText: `${basic.title}${artistsSort}`.toLowerCase()
  }
}

async function fetchTracklist(releaseId) {
  const release = await discogsFetch(`${DISCOGS_API}/releases/${releaseId}`)
  return release.tracklist || []
}

async function main() {
  console.log(`Syncing Discogs collection for user: ${username}`)
  console.log(`Mode: ${includeTracklists ? 'full (with tracklists)' : 'basic (collection metadata only)'}`)

  try {
    await discogsFetch(`${DISCOGS_API}/users/${username}`)
    console.log('Discogs authentication OK')
  } catch (error) {
    throw new Error(`Discogs authentication failed for user "${username}". Check DISCOGS_TOKEN and DISCOGS_USERNAME secrets. ${error.message}`)
  }

  const collectionItems = await fetchCollectionItems()
  const records = collectionItems.map(item => normalizeFromCollectionItem(item))

  if (includeTracklists) {
    let enrichedCount = 0

    for (let i = 0; i < records.length; i += 1) {
      try {
        records[i].tracklist = await fetchTracklist(records[i].id)
        enrichedCount += 1
        console.log(`Fetched tracklist ${i + 1}/${records.length}: ${records[i].title}`)
      } catch (error) {
        console.warn(`Skipped tracklist for release ${records[i].id}: ${error.message}`)
      }

      if (i < records.length - 1) {
        await sleep(REQUEST_DELAY_MS)
      }
    }

    console.log(`Enriched ${enrichedCount}/${records.length} releases with tracklists`)
  } else {
    console.log(`Built ${records.length} records from collection metadata (no per-release API calls)`)
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
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
