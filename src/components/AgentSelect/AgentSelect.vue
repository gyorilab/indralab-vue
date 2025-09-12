<template>
  <span class="agent-select">

    <span v-if="!options || options_empty">
      <input
        class="form-control"
        type="text"
        v-model="agent_str"
        placeholder="Enter agent name (e.g. 'MEK', 'FPLX:MEK' or 'hgnc:3321')"
      />

      <!-- live hint, replaces the old namespace selector -->
      <small class="hint" v-if="agent_str">
        <template v-if="detectedNamespace === 'HGNC'">
          Searching by <b>HGNC</b> identifier (e.g. 'hgnc:3236')
        </template>
        <template v-else-if="detectedNamespace === 'FPLX'">
          Searching by <b>FPLX</b> identifier (e.g. 'fplx:MAPK')
        </template>
        <template v-else>
          Searching by <b>text name</b> (e.g. 'EGFR')
        </template>
      </small>

      <button class="agent-select-button btn btn-primary" @click="lookupOptions">
        Find Identifier with Gilda
      </button>
      <span v-show="searching">Searching...</span>
      <span v-show="options_empty">No groundings found...</span>
      <i
        style="color: red; cursor: default"
        v-show="search_error"
        :title="search_error"
      >
        Search failed!
      </i>
    </span>

    <span v-else-if="options.length === 1">
      <span class="label">GILDA grounding:</span>
      <span class="form-control gilda-dropdown" v-html="printOption(options[0])"></span>
      <button class="agent-select-button btn btn-primary" @click="resetOptions">Cancel</button>
    </span>

    <span v-else>
      <span class="label">GILDA grounding:</span>
      <select class="form-control gilda-dropdown" v-model="selected_option_idx">
        <option :value="-1" selected disabled hidden>Select grounding option...</option>
        <option
          v-for="(option, option_idx) in options"
          :key="option_idx"
          :value="option_idx"
          v-html="printOption(option)"
        ></option>
      </select>
      <button class="agent-select-button btn btn-primary" @click="resetOptions">
        Cancel
      </button>
    </span>
  </span>
</template>

<script>
export default {
  name: 'AgentSelect',
  props: ['value','exampleTick'],
  data () {
    return {
      agent_str: '',
      searching: false,
      options: null,
      selected_option_idx: -1,
      search_error: null,
    }
  },
  methods: {
    async lookupOptions () {
      this.searching = true
      if (!this.agent_str) {
        alert('Please enter an agent string...')
        this.searching = false
        return
      }
      const resp = await fetch(`${this.$ground_url}?agent=${encodeURIComponent(this.agent_str)}`, { method: 'GET' })
      if (resp.status === 200) {
        this.options = await resp.json()
        if (this.options.length === 1) this.selected_option_idx = 0
        this.search_error = null
      } else {
        this.search_error = `(${resp.status}) ${resp.statusText}`
      }
      this.searching = false
    },
    resetOptions () {
      this.options = null
      this.selected_option_idx = -1
    },
    printOption (option) {
      const term = option.term
      return `<b>${term.entry_name}</b> (score: ${option.score.toFixed(2)}, ${term.id} from ${term.db})`
    }
  },
  computed: {
    options_empty () {
      if (!this.options) return false
      return this.options.length === 0
    },
    // Detect a prefixed identifier like "hgnc:1234" or "fplx:MAPK"
    parsedPrefix () {
      const text = (this.agent_str || '').trim()
      if (/^hgnc:?/i.test(text)) {
        const id = text.replace(/^hgnc:?/i, '').trim()
        return { ns: 'HGNC', id: id || null }
      }
      if (/^fplx:?/i.test(text)) {
        const id = text.replace(/^fplx:?/i, '').trim()
        return { ns: 'FPLX', id: id || null }
      }
      return null
    },
    detectedNamespace () {
      return this.parsedPrefix ? this.parsedPrefix.ns : null
    },
    agent_id_from_input () {
      // if prefixed, return the id part, else the raw text
      if (this.parsedPrefix) return this.parsedPrefix.id
      return (this.agent_str || '').trim()
    },
    namespace_from_input () {
      // if prefixed, use that; else mimic the old default behavior ("AUTO")
      if (this.parsedPrefix) return this.parsedPrefix.ns
      return 'AUTO'
    },

      partialConstraint () {
      let ret = null;

      if (this.options && !this.options_empty && this.selected_option_idx >= 0) {
        const chosen = this.options[this.selected_option_idx];
        ret = { agent_id: chosen.term.id, namespace: chosen.term.db };
      } else if (this.agent_id_from_input) {
        ret = { agent_id: this.agent_id_from_input, namespace: this.namespace_from_input };
      }

      return ret;
    },

  },
  watch: {
      exampleTick () {
      const v = this.value || {};
      this.agent_str = typeof v.agent_id === 'string' ? v.agent_id : '';
      this.options = null;
      this.selected_option_idx = -1;
      this.search_error = null;
    },
      partialConstraint (pc) {
      if (!pc) return;
      const base = (this.value && typeof this.value === 'object') ? this.value : {};
      const merged = { ...base, ...pc };
      this.$emit('input', merged);
    },
  }
}
</script>
<style scoped>
  .agent-select {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0.2em;
  }

  .agent-select .role-dropdown {
    width: 80px;
    display: inline-flex;
  }

  .agent-select input.form-control {
    width: 450px;
    display: inline-flex;
  }

  .agent-select .gilda-dropdown {
    min-width: 450px;
    width: auto;
    display: inline-flex;
  }

  .agent-select .btn {
    margin-left: 6px;
  }
</style>