<template>
  <div class="mesh-select form-group col-12 col-lg-10 mb-3">
    <label :for="inputIdComputed" class="d-block mb-2">
      {{ labelText }}
    </label>
    <template v-if="!options || options_empty">
      <div class="d-flex align-items-center flex-wrap flex-md-nowrap mesh-row">
        <input
          class="form-control flex-grow-1"
          type="text"
          v-model="mesh_str"
          :id="inputIdComputed"
          placeholder="(e.g. 'Covid-19', 'Diabetes', 'D000086382')"
        >
        <button
          type="button"
          class="btn btn-secondary ml-md-2 mt-2 mt-md-0 btn-with-tooltip mesh-action-button"
          @click="lookupOptions"
        >
          Find Identifier
          <span class="info-icon">?</span>
          <div class="tooltip-box">
            Use this button to ground the name with
            <a href="https://grounding.indra.bio/" target="_blank">Gilda</a>.
          </div>
        </button>
      </div>
      <div class="mt-1">
        <small v-if="hasSearched && searching" class="text-muted d-block">Searching...</small>
        <small v-if="hasSearched && options_empty" class="text-warning d-block">No MeSH IDs found...</small>
        <small
          v-if="hasSearched && search_error"
          class="text-danger d-block"
          :title="search_error"
          style="cursor: default"
        >Search failed!</small>
      </div>
    </template>

    <div v-else-if="options.length === 1" class="mt-2">
      <small class="text-muted d-block mb-1">GILDA grounding</small>
      <div class="d-flex align-items-center flex-wrap flex-md-nowrap mesh-row">
        <div class="form-control gilda-dropdown flex-grow-1" :id="inputIdComputed" v-html="printOption(options[0])"></div>
        <button type="button" class="btn btn-outline-secondary ml-md-2 mt-2 mt-md-0 mesh-action-button" @click="resetOptions">
          Change
        </button>
      </div>
    </div>

    <div v-else class="mt-2">
      <small class="text-muted d-block mb-1">GILDA grounding</small>
      <div class="d-flex align-items-center flex-wrap flex-md-nowrap mesh-row">
        <select class="custom-select gilda-dropdown flex-grow-1" :id="inputIdComputed" v-model="selected_option_idx">
          <option :value='-1' selected disabled hidden>Select grounding option...</option>
          <option v-for='(option, option_idx) in options'
                  :key='option_idx'
                  :value='option_idx'
                  v-html="printOption(option)">
          </option>
        </select>
        <button class="btn btn-outline-secondary ml-md-2 mt-2 mt-md-0 mesh-action-button"
                @click='resetOptions'>
            Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "MeshSelect",
    props: {
      value: {},
      exampleTick: {},
      inputId: {
        type: String,
        default: null
      },
      labelText: {
        type: String,
        default: 'Context Filter (MeSH)'
      }
    },
    data: function() {
      return {
        mesh_str: '',
        searching: false,
        options: null,
        selected_option_idx: -1,
        search_error: null,
        suppressEmitOnce: false,
        hasSearched: false,
      }
    },
    methods: {
      lookupOptions: async function() {
        if (!this.mesh_str) {
          alert("Please enter a mesh term...");
          this.searching=false;
          return;
        }
        if (!this.$ground_url) {
          this.search_error = 'Grounding service URL is not configured.';
          this.hasSearched = true;
          return;
        }
        this.search_error = null;
        this.hasSearched = true;
        this.searching = true;
        const resp = await fetch(
          `${this.$ground_url}?agent=${this.mesh_str}`,
          {method: 'GET'}
        );
        const contentType = resp.headers.get('content-type') || '';
        if (!resp.ok) {
          this.search_error = `(${resp.status}) ${resp.statusText}`;
          this.options = [];
        } else if (!contentType.includes('application/json')) {
          this.search_error = 'Unexpected response from grounding service.';
          this.options = [];
        } else {
          const options = await resp.json();
          this.options = options.filter(o => o.term?.db === 'MESH');
          if (this.options.length === 1) this.selected_option_idx = 0;
          this.search_error = null;
        }
        this.searching = false;
      },
      resetOptions: function() {
        this.options = null;
        this.selected_option_idx = -1;
        this.hasSearched = false;
        this.search_error = null;
        this.searching = false;
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
      },
      inputIdComputed () {
        return this.inputId || `mesh-input-${this._uid}`
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
        this.hasSearched = false;
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
  .mesh-select {
    display: block;
    width: 100%;
    max-width: 100%;
  }

  .mesh-row {
    gap: 8px;
  }

  .mesh-action-button {
    min-width: 170px;
    flex-shrink: 0;
  }

  .gilda-dropdown {
    width: 100%;
    min-width: 0;
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