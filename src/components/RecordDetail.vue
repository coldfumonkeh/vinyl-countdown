<template>
  <div class="post">
    <div v-if="loading" class="loading">
      Loading...
    </div>

    <div v-if="error" class="error alert alert-danger mt-4">
      {{ error }}
    </div>

    <div v-if="record" class="content">
      <div class="card mt-4">
        <table class="table m-0">
          <tr>
            <td>
              <img v-bind:src="record.thumb" :alt="record.title" />
              <br /><br />
              <a
                class="btn btn-outline-primary"
                :href="'https://www.discogs.com/release/' + record.id"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Discogs
              </a>
            </td>
            <td>
              <h2>{{ record.title }}</h2>
              <p>{{ record.artists_sort }}</p>
              <p v-if="record.released_formatted"><small>Released: {{ record.released_formatted }}</small></p>
              <p v-if="record.labels && record.labels.length"><small>Label: {{ record.labels[0].name }} - {{ record.labels[0].catno }}</small></p>
              <span v-for="(genre, index) in record.genres" :key="'genre-' + index">
                <span class="badge rounded-pill bg-info text-dark">{{ genre }}</span>&nbsp;
              </span>
              <span v-for="(style, index) in record.styles" :key="'style-' + index">
                <span class="badge rounded-pill bg-secondary">{{ style }}</span>&nbsp;
              </span>
            </td>
          </tr>
          <tr v-if="record.tracklist && record.tracklist.length">
            <td></td>
            <td>
              <ul class="list-group">
                <span v-for="(track, index) in record.tracklist" :key="index">
                  <li :class="[ track.type_ == 'heading' ? 'list-group-item list-group-item-secondary' : 'list-group-item list-group-item-light']">
                    <small>
                      <span v-if="track.type_ == 'heading'">{{ track.title }}</span>
                      <span v-else>{{ track.position }} - {{ track.title }}</span>
                    </small>
                  </li>
                </span>
              </ul>
            </td>
          </tr>
          <tr v-else>
            <td></td>
            <td>
              <p class="text-muted mb-0">
                <small>Track listing is available on Discogs.</small>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { loadCollection, getRecordById } from '@/services/collectionService'

export default {
  data() {
    return {
      loading: false,
      record: null,
      error: null
    }
  },
  created() {
    this.fetchData()
  },
  watch: {
    '$route': 'fetchData'
  },
  methods: {
    async fetchData() {
      this.error = null
      this.record = null
      this.loading = true

      try {
        const collection = await loadCollection()
        const record = getRecordById(collection, this.$route.params.id)

        if (!record) {
          this.error = 'Record not found.'
          return
        }

        this.record = record
      } catch (error) {
        this.error = 'Unable to load record.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
