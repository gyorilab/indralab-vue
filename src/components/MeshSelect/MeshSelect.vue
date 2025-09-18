<template>
  <span class="mesh-select">
      <span v-if="!options || options_empty">
        <input class="form-control"
               type="text"
               v-model="mesh_str"
               placeholder="Enter mesh ID/term...">
        <button class="agent-select-button btn btn-primary"
                @click='lookupOptions'>
            Find Identifiers
        </button>
        <span v-show='searching'>Searching...</span>
        <span v-show='options_empty'>No mesh IDs found...</span>
        <i style="color: red; cursor: default"
           v-show="search_error"
           :title="search_error">
          Search failed!
        </i>
      </span>
      <span v-else-if="options.length === 1">
        <span class="label">GILDA grounding:</span>
        <span class='form-control' v-html="printOption(options[0])"></span>
        <button class="btn btn-primary"
                @click='resetOptions'>
            Cancel
        </button>
      </span>
      <span v-else>
        <span class="label">GILDA grounding:</span>
        <select class="form-control" v-model='selected_option_idx'>
          <option :value='-1' selected disabled hidden>Select grounding option...</option>
          <option v-for='(option, option_idx) in options'
                  :key='option_idx'
                  :value='option_idx'
                  v-html="printOption(option)">
          </option>
        </select>
        <button class="agent-select-button btn btn-primary"
                @click='resetOptions'>
            Cancel
        </button>
      </span>
  </span>
</template>

<script>
  export default {
    name: "MeshSelect",
    props: ['value', 'exampleTick'],
    data: function() {
      return {
        mesh_str: '',
        searching: false,
        options: null,
        selected_option_idx: -1,
        search_error: null,
        suppressEmitOnce: false,
      }
    },
    methods: {
      lookupOptions: async function() {
        this.searching = true;
        if (!this.mesh_str) {
          alert("Please enter a mesh term...");
          this.searching=false;
          return;
        }
        const resp = await fetch(
          `${this.$ground_url}?agent=${this.mesh_str}`,
          {method: 'GET'}
        );
        if (resp.status === 200) {
          const options = await resp.json();
          this.options = options.filter(o => o.term?.db === 'MESH');
          if (this.options.length === 1) this.selected_option_idx = 0;
          this.search_error = null;
        } else {
          this.search_error = `(${resp.status}) ${resp.statusText}`
        }
        this.searching = false;
      },
      resetOptions: function() {
        this.options = null;
        this.selected_option_idx = -1;
      },
      printOption: function(option) {
        let term = option.term;
        return (`<b>${term.entry_name}</b> `
            + `(score: ${option.score.toFixed(2)}, `
            + `${term.id})`);
      }
    },
    computed: {
      options_empty: function() {
        if (!this.options)
          return false;
        return this.options.length === 0;
      },
      constraint: function() {
        let ret = null;
        if (this.mesh_str && !this.options) {
          ret = { mesh_ids: [this.mesh_str] };
        } else if (this.options && this.selected_option_idx >= 0) {
          ret = { mesh_ids: [this.options[this.selected_option_idx].term.id] };
        }
        return ret;
      }
    },
    watch: {
      exampleTick() {
        const v = this.value || {};
        const ids = Array.isArray(v.mesh_ids) ? v.mesh_ids : [];
        this.suppressEmitOnce = true;
        this.mesh_str = ids[0] || '';
        this.options = null;
        this.selected_option_idx = -1;
        this.search_error = null;
      },
      constraint(newVal) {
        if (!newVal) return;
        if (this.suppressEmitOnce) { this.suppressEmitOnce = false; return; }
        const base = (this.value && typeof this.value === 'object') ? this.value : {};
        const merged = { ...base, ...newVal };
        this.$emit('input', merged);
      }
    }
  }
</script>

<style scoped>
  .agent-select {
    margin: 0.2em;
  }
  select, input, button {
    margin: 0.2em;
  }
  .label {
    margin-left: 0.5em;
    margin-right: 0.2em;
  }
</style>