<template>
  <img
    :src="recordThumbUrl(src)"
    :alt="alt"
    :class="['record-thumb', `record-thumb--${variant}`, imgClass]"
    @error="onThumbError"
  />
</template>

<script>
import { onThumbError, recordThumbUrl } from '@/utils/recordImage'

export default {
  props: {
    src: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      required: true
    },
    imgClass: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'list'
    }
  },
  methods: {
    recordThumbUrl,
    onThumbError
  }
}
</script>

<style scoped>
.record-thumb {
  display: block;
  object-fit: cover;
  aspect-ratio: 1 / 1;
}

.record-thumb--list {
  width: 100%;
  max-width: 150px;
  height: auto;
}

.record-thumb--detail {
  width: 100%;
  max-width: 200px;
  height: auto;
}
</style>
