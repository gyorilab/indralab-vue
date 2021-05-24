<template>
  <span class="source-display">
    <span v-for="(src_group, cat, idx) in sources" :key="cat">
      <span v-if="idx > 0" class="badge badge-source">|</span>
      <span v-for="src in src_group"
            :key="src">
        <span :class="`${badgeClass} source-${src}`"
              v-if="showSrc(src)"
              :title="src">
          <span v-if="source_counts">
            {{ source_counts[src] }}
          </span>
          <span v-else>
            {{ src }}
          </span>
        </span>
      </span>
    </span>
  </span>
</template>

<script>
  export default {
    name: "SourceDisplay",
    props: {
      source_counts: {
        type: Object,
        default: null
      }
    },
    methods: {
      showSrc: function(src) {
        if (this.source_counts === null)
          return true;
        if ( !(src in this.source_counts) )
          return false;
        else if ( this.source_counts[src] > 0 )
          return true;
        return false;
      },
    },
    computed: {
      sources: function() {
        return this.$sources
      },

      badgeClass: function() {
        let base = 'badge badge-source';
        if (this.source_counts === null)
          return  base + ' label';
        else
          return base;
      }
    }
  }
</script>

<style scoped>
  .label {
    margin: 1px;
  }
</style>