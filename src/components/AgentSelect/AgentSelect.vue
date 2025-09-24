<template>
  <span class="agent-select">

<span v-if="!options || options_empty">
  <div class="agent-input-wrap">
    <input
      class="form-control"
      type="text"
      v-model="agent_str"
      :placeholder="isOther
        ? `Enter optional name (e.g. 'MEK', 'FPLX:MEK' or 'hgnc:3321')`
        : `Enter name (e.g. 'MEK', 'FPLX:MEK' or 'hgnc:3321')`"
    />
    <span v-if="agent_str" class="inline-hint" aria-hidden="true">
      {{ hintText }}
    </span>
  </div>

  <button class="btn btn-primary btn-with-tooltip" @click="lookupOptions">
      Find Identifier
      <span class="info-icon">?</span>
      <div class="tooltip-box">
        Use this button to ground the name with
        <a href="https://grounding.indra.bio/" target="_blank">Gilda</a>.
      </div>
  </button>
  <span v-show="searching">Searching...</span>
  <span v-show="options_empty">No groundings found...</span>
  <i style="color: red; cursor: default" v-show="search_error" :title="search_error">Search failed!</i>
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
  props: ['value','exampleTick','isOther'],
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
    displayText () {
     if (this.options && !this.options_empty && this.selected_option_idx >= 0) {
       return this.options[this.selected_option_idx].term.entry_name;
     }
     return (this.agent_str || '').trim();
   },
    options_empty () {
      if (!this.options) return false
      return this.options.length === 0
    },

    parsedPrefix () {
      const text = (this.agent_str || '').trim()
      const m = text.match(/^(hgnc|fplx)\s*[：: ]?\s*(.+)?$/i)
      if (!m) return null
      const ns = m[1].toUpperCase()
      const id = (m[2] || '').trim() || null
      return { ns, id }
    },

    detectedNamespace () {
      return this.parsedPrefix ? this.parsedPrefix.ns : null
    },

    agent_id_from_input () {
      if (this.parsedPrefix) return this.parsedPrefix.id
      return (this.agent_str || '').trim()
    },

    namespace_from_input () {
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

    hintText () {
      const p = this.parsedPrefix
      if (p && p.ns === 'HGNC') {
        return p.id ? `Searching by HGNC id ${p.id}` : 'Searching by HGNC id'
      }
      if (p && p.ns === 'FPLX') {
        return p.id ? `Searching by FPLX id ${p.id}` : 'Searching by FPLX id'
      }
      return 'Searching by Text name'
    },

  },
  watch: {
    exampleTick () {
      const v = this.value || {};
      const ns = typeof v.namespace === 'string' ? v.namespace.toUpperCase() : null;
      const id = typeof v.agent_id === 'string' ? v.agent_id : '';
      if (ns && id && ns !== 'AUTO') {
        this.agent_str = `${ns.toLowerCase()}:${id}`;
      } else {
        this.agent_str = id;
      }
      this.options = null;
      this.selected_option_idx = -1;
      this.search_error = null;
    },
      partialConstraint (pc) {
      if (!pc) return;
      const base = (this.value && typeof this.value === 'object') ? this.value : {};
      const merged = { ...base, ...pc };
      this.$emit('input', merged);
      this.$emit('display', this.displayText);
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

  .agent-input-wrap {
  position: relative;
  display: inline-block;
  }

  .inline-hint {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    font-size: 12px;
    pointer-events: none;
    background: #fff;
    padding-left: 6px;
  }

  .btn-with-tooltip{ position:relative; padding-right:34px; overflow:visible; }
  .btn-with-tooltip, .btn-with-tooltip .info-icon{ cursor:pointer; }


  .btn-with-tooltip .info-icon{
    position:absolute; right:8px; top:50%; transform:translateY(-50%);
    width:18px; height:18px; border-radius:50%;
    background:#007bff; color:#fff; font:700 12px/18px sans-serif; text-align:center;
    border:1px solid rgba(0,0,0,.15);
  }

  /* bubble  hover area*/
  .btn-with-tooltip .info-icon::after{
    content:""; position:absolute; left:100%; top:-8px; bottom:-8px; width:32px;
  }


  .btn-with-tooltip .tooltip-box{
    position:absolute; left:calc(100% + 8px); top:50%; transform:translateY(-50%);
    min-width:240px; background:#f8f9fa; color:#333;
    border:1px solid #ddd; border-radius:6px; padding:8px 10px;
    box-shadow:0 2px 8px rgba(0,0,0,.08); z-index:1000;
    visibility:hidden; opacity:0; pointer-events:none; transition:opacity .12s;
  }

  .btn-with-tooltip .info-icon:hover + .tooltip-box,
  .btn-with-tooltip .tooltip-box:hover{
    visibility:visible; opacity:1; pointer-events:auto;
  }
</style>