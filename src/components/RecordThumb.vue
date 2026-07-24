<template>
  <img
    :src="recordThumbUrl(src)"
    :alt="alt"
    :class="imgClass"
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
    }
  },
  methods: {
    recordThumbUrl,
    onThumbError
  }
}
</script>
