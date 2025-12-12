<template>
<span class="type-select">
  <multiselect
    v-model="selected_types"
    :options="typeOptions"
    :multiple="true"
    :close-on-select="true"
    :clear-on-select="false"
    :preserve-search="true"
    :searchable="selected_types.length === 0"
    placeholder="Select type(s)..."
    :show-labels="true"
    select-label=""
    deselect-label="remove"
  />
  <div class="form-check form-check-inline">
    <input
      type="checkbox"
      class="form-check-input"
      id="inc_subtypes"
      v-model="include_subclasses"
    />
    <label class="form-check-label" for="inc_subtypes">Include subtypes</label>
  </div>
</span>
</template>

<script>
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

export default {
  name: 'TypeSelect',
  components: { Multiselect },
  props: ['value'], // { stmt_types: string[], include_subclasses: boolean } | null
  data () {
    return {
      selected_types: [],
      include_subclasses: false,
      isSyncingFromParent: false
    }
  },
  computed: {
    typeOptions () {
      const t = this.$stmt_types
      if (Array.isArray(t)) return t
      if (t && typeof t === 'object') return Object.keys(t)
      return []
    },
    constraint () {
      if (!this.selected_types.length) return null
      return {
        stmt_types: this.selected_types,
        include_subclasses: this.include_subclasses
      }
    }
  },
  watch: {
    selected_types () { this.emitIfUserChange() },
    include_subclasses () { this.emitIfUserChange() },
    value: {
      handler (v) {
        this.isSyncingFromParent = true
        this.selected_types = v && Array.isArray(v.stmt_types) ? v.stmt_types.slice() : []
        this.include_subclasses = !!(v && v.include_subclasses)
        this.$nextTick(() => { this.isSyncingFromParent = false })
      },
      immediate: true
    }
  },
  methods: {
    emitIfUserChange () {
      if (this.isSyncingFromParent) return
      this.$emit('input', this.constraint)
    }
  }
}
</script>

<style scoped>
.type-select {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 0.2em;
  min-width: 400px;
}
.form-check-inline {
  margin-left: 8px;
  white-space: nowrap;
}
</style>