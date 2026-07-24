<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <div id="sort-bar" class="row gy-2 gx-3 align-items-center mt-4">
          <div class="col-auto">
            <label class="visually-hidden" for="sortBy">Sort By</label>
            <select
              class="form-select"
              id="sortBy"
              name="sortBy"
              v-model="sortBy"
            >
              <option value="title">Release Title</option>
              <option value="artist">Artist Name</option>
            </select>
          </div>
          <div class="col-auto">
            <button
              v-on:click="ascending = !ascending"
              class="sort-button btn btn-primary"
            >
              <i v-if="ascending" class="bi bi-arrow-up"></i>
              <i v-else class="bi bi-arrow-down"></i>
            </button>
          </div>
          <div class="col-auto">
            <label class="visually-hidden" for="autoSizingInputGroup"
              >Keyword Search</label
            >
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                v-model="searchValue"
                placeholder="Search Records"
                id="search-input"
              />
            </div>
          </div>
          <div class="col-auto" v-if="totalRecords">
            <div class="col-auto gy-2 gx-3 align-items-right mt-3">
              Total Records: {{ filteredRecords.length }}/{{ totalRecords }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="mt-4 text-muted">Loading collection...</div>
    <div v-else-if="error" class="alert alert-danger mt-4">{{ error }}</div>

    <div v-else class="row">
      <div class="col-12" v-for="record in filteredRecords" :key="record.id">
        <div class="card mb-2 mt-4">
          <div class="row g-0">
            <div class="col-4">
              <img
                v-bind:src="record.thumb"
                class="img-fluid rounded-start"
                :alt="record.title"
              />
            </div>
            <div class="col-8">
              <div class="card-body">
                <div class="row">
                  <div class="col-12">
                    <p class="card-title">
                      <router-link :to="{ path: '/r/' + record.id }"
                        >{{ record.title }} -
                        <small>{{ record.artists_sort }}</small></router-link
                      >
                    </p>
                    <p v-if="record.released_formatted">
                      <small>Released: {{ record.released_formatted }}</small>
                      <span
                        v-for="(genre, index) in record.genres"
                        :key="index"
                      >
                        &nbsp;<span
                          class="badge rounded-pill bg-info text-dark"
                          >{{ genre }}</span
                        >
                      </span>
                    </p>
                    <p v-if="record.labels && record.labels.length">
                      <small
                        >Label: {{ record.labels[0].name }} -
                        {{ record.labels[0].catno }}</small
                      >
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadCollection } from '@/services/collectionService'

export default {
  data() {
    return {
      ascending: true,
      sortBy: 'title',
      searchValue: '',
      records: [],
      loading: true,
      error: null
    }
  },
  async created() {
    this.searchValue = this.$route.params.query_string || ''

    try {
      const collection = await loadCollection()
      this.records = collection.records || []
    } catch (error) {
      this.error = 'Unable to load collection.'
    } finally {
      this.loading = false
    }
  },
  watch: {
    '$route.params.query_string'(value) {
      this.searchValue = value || ''
    }
  },
  computed: {
    totalRecords() {
      return this.records.length
    },
    filteredRecords() {
      let tempRecords = [...this.records]

      if (this.searchValue) {
        const query = this.searchValue.toLowerCase()
        tempRecords = tempRecords.filter(item =>
          item.searchText.includes(query)
        )
      }

      tempRecords = tempRecords.sort((a, b) => {
        if (this.sortBy === 'title') {
          const fa = a.title.toLowerCase()
          const fb = b.title.toLowerCase()
          if (fa < fb) return -1
          if (fa > fb) return 1
          return 0
        }

        const fa = (a.artists[0] && a.artists[0].name
          ? a.artists[0].name
          : ''
        ).toLowerCase()
        const fb = (b.artists[0] && b.artists[0].name
          ? b.artists[0].name
          : ''
        ).toLowerCase()
        if (fa < fb) return -1
        if (fa > fb) return 1
        return 0
      })

      if (!this.ascending) {
        tempRecords.reverse()
      }

      return tempRecords
    }
  }
}
</script>
