<template>
  <div>
    <header class="border-bottom bg-white mb-4">
      <div class="container py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <router-link to="/" class="text-decoration-none text-dark">
            <h1 class="h4 mb-0">The Vinyl Countdown</h1>
          </router-link>
          <p v-if="syncedAt" class="text-muted small mb-0">Last synced: {{ syncedAt }}</p>
        </div>
        <div class="d-flex gap-3">
          <router-link to="/about">About</router-link>
          <a href="https://www.discogs.com/user/coldfumonkeh/collection" target="_blank" rel="noopener noreferrer">
            View on Discogs
          </a>
        </div>
      </div>
    </header>
    <main class="container pb-5">
      <router-view />
    </main>
  </div>
</template>

<script>
import { loadCollection } from '@/services/collectionService'

export default {
  data() {
    return {
      syncedAt: null
    }
  },
  async created() {
    try {
      const collection = await loadCollection()
      if (collection.syncedAt) {
        this.syncedAt = new Date(collection.syncedAt).toLocaleString()
      }
    } catch (error) {
      this.syncedAt = null
    }
  }
}
</script>
