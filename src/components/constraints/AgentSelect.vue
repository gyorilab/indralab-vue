<template>
  <span class='agent-select'>
      <span class="label">role:</span>
      <select class="form-control"
              v-model='role_str'>
        <option v-for='role in role_options'
                :key='role'
                :value='role'>
          {{ role }}
        </option>
      </select>
      <span v-if="!options || options_empty">
        <span class="label">text:</span>
        <input class="form-control"
               type="text"
               v-model="agent_str"
               placeholder="Enter agent here">
        <span class="label">namespace:</span>
        <select v-model="namespace"
                class="form-control"
                title="namespace">
          <option v-for="option in namespace_options"
                  :key="option"
                  :value="option">
            {{ option }}
          </option>
        </select>
        <input v-if="namespace === 'other'"
               class="form-control"
               v-model="custom_namespace"
               placeholder="Enter namespace...">
        OR
        <button class="agent-select-button btn btn-primary"
                @click='lookupOptions'>
            Ground with GILDA
        </button>
        <span v-show='searching'>Searching...</span>
        <span v-show='options_empty'>No groundings found...</span>
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
    name: "AgentSelect",
    props: ['value'],
    data: function() {
      return {
        role_str: 'any',
        agent_str: '',
        searching: false,
        options: null,
        selected_option_idx: -1,
        namespace: "auto",
        role_options: [
          'subject',
          'object',
          'any',
        ],
        namespace_options: [
          "auto",
          "text",
          "name",
          "fplx",
          "hgnc",
          "other"
        ],
        custom_namespace: null,
        search_error: null,
      }
    },
    methods: {
      lookupOptions: async function() {
        this.searching = true;
        if (!this.agent_str) {
          alert("Please enter an agent string...");
          this.searching=false;
          return;
        }
        const resp = await fetch(
          `${this.$ground_url}?agent=${this.agent_str}`,
          {method: 'GET'}
          );
        if (resp.status === 200) {
          this.options = await resp.json();
          if (this.options.length === 1)
            this.selected_option_idx = 0;
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
        return (`<b>${term.entry_name}</b> (score: ${option.score.toFixed(2)}, `
                + `${term.id} from ${term.db})`);
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

        // Handle the agent part of the query.
        if (this.agent_str)
          if (!this.options || this.options_empty) {
            if (this.namespace !== 'other')
              ret = {
                agent_id: this.agent_id,
                namespace: this.namespace.toUpperCase(),
              };
            else if (this.custom_namespace)
              ret = {
                agent_id: this.agent_id,
                namespace: this.custom_namespace.toUpperCase(),
              };
          } else {
            if (this.selected_option_idx >= 0)
              ret = {
                agent_id: this.options[this.selected_option_idx].term.id,
                namespace: this.options[this.selected_option_idx].term.db,
              };
          }
        // Handle the role part.
        if (ret !== null && this.role_str !== 'any')
          ret.role = this.role_str;
        return ret;
      },
      agent_id: function() {
        return this.agent_str.trim();
      }
    },
    watch: {
      constraint: function(constraint) {
        this.$emit('input', constraint);
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