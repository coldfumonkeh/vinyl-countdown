#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const DISCOGS_API = 'https://api.discogs.com'
const USER_AGENT = 'VinylCountdown/1.0 +https://github.com/coldfumonkeh/vinyl-countdown'
const REQUEST_DELAY_MS = 1100

const token = process.env.DISCOGS_TOKEN
const username = process.env.DISCOGS_USERNAME || 'coldfumonkeh'

if (!token) {
  console.error('DISCOGS_TOKEN environment variable is required')
  process.exit(1)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function discogsFetch(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${token}`,
      'User-Agent': USER_AGENT
    }
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Discogs API error ${response.status} for ${url}: ${body}`)
  }

  return response.json()
}

async function fetchCollectionReleaseIds() {
  const releaseIds = []
  let page = 1
  let pages = 1

  while (page <= pages) {
    const url = `${DISCOGS_API}/users/${username}/collection/folders/0/releases?per_page=100&page=${page}`
    const data = await discogsFetch(url)
    pages = data.pagination.pages

    for (const item of data.releases) {
      releaseIds.push(item.basic_information.id)
    }

    console.log(`Fetched collection page ${page}/${pages} (${releaseIds.length} releases so far)`)
    page += 1

    if (page <= pages) {
      await sleep(REQUEST_DELAY_MS)
    }
  }

  return releaseIds
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

  const releaseIds = await fetchCollectionReleaseIds()
  const records = []

  for (let i = 0; i < releaseIds.length; i += 1) {
    const releaseId = releaseIds[i]
    const record = await fetchReleaseDetails(releaseId)
    records.push(record)
    console.log(`Fetched release ${i + 1}/${releaseIds.length}: ${record.title}`)

    if (i < releaseIds.length - 1) {
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
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
