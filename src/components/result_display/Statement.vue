<template>
  <div class="statement">
    <div class="row clickable" @click="toggleList">
      <div class="col text-start">
        <h5>
          <span v-html='english'></span>
          <small v-for='badge in displayed_badges'
                :class="`badge rounded-pill float-${badge.loc === 'right' ? 'end' : 'start'}`"
                :style="`background-color: ${badge.color}; color: white;`"
                :title="badge.title"
                :key='badge.label'>
              <a v-if='badge.href'
                :style="`background-color: ${badge.color}; color: white;`"
                :href='badge.href' target="_blank">
                    {{ badge.symbol }}{{ badge.num }}</a>
              <span v-else>{{ badge.symbol }}{{ badge.num }}</span>
          </small>
        </h5>
      </div>
      <div class="col-auto text-end" v-if="sources">
        <SourceDisplay :source_counts="sources"></SourceDisplay>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="container">
          <div class='ev-list' v-show='show_list'>
            <Evidence v-for='ev in list_shown'
                      :key='ev.source_hash'
                      v-bind='ev'
                      :stmt_hash='hash'/>
            <div class="text-center load-error" v-if="load_failure">
              <i style="color: red">Failed to load more evidence: {{ load_failure }}</i>
            </div>
            <div class='text-center clickable'
                 :style="`cursor: ${(searching) ? 'progress' : 'pointer'}`"
                 v-show='show_load_more'
                 @click='loadMore'>
              Load {{ loaded ? next_batch : '' }} more...
            </div>
            <div class='text-center clickable'
                 :style="`cursor: ${(searching) ? 'progress' : 'pointer'}`"
                 v-show='show_buttons'
                 @click='loadAll'>
              Load all {{ base_list.length - end_n }} remaining...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import piecemeal_mixin from '../mixins/piecemeal_mixin'
  import {Evidence, SourceDisplay} from "@";

  export default {
    name: "Statement",
    components: {Evidence, SourceDisplay},
    props: {
      // Look into the statement JSON schema:
      // https://raw.githubusercontent.com/sorgerlab/indra/master/indra/resources/statements_schema.json
      // and ajv for validation: https://github.com/ajv-validator/ajv
      // See also: https://json-schema.org/
      evidence: {
        type: Array,
        required: true
      },
      english: String,
      hash: String,
      sources: Object,
      total_evidence: Number,
      context_queries: {
        type: Array,
        default: null
      },
      num_curations: {
        type: Number,
        default: null
      },
      loadable: {
        type: Boolean,
        default: false,
      },
      init_expanded: {
        type: Boolean,
        default: false
      },
      show_total_ev_only: {
        type: Boolean,
        default: false
      },
      stmt_hash_url: {
        // Use to replace the global $stmt_hash_url
        type: String,
        default: null
      },
      badges: Array
    },
    data: function() {
      return {
        show_list: false,
        searching: false,
        loaded: false,
        loaded_evidence: null,
        load_failure: null,
      }
    },
    created: function () {
      this.show_list = this.init_expanded;
    },
    methods: {
      getMore: async function() {
        /**
         * Get more evidence for this statement (e.g. hash)
         */
        if (this.searching || this.loaded)
          return false;

        this.searching = true;

        let params = [
          'format=json-js',
          'with_english=true',
          'with_cur_counts=true',
          'filter_ev=true'
        ];
        console.log(`limit=${this.next_batch}`);
        console.log(`offset=${this.end_n}`);
        if (this.context_queries != null)
          params = [...params, ...this.context_queries]

        const resp = await fetch(this.evidence_url + this.hash
                + '?' + params.join('&'));
        let success = true;
        window.console.log(resp.status);
        if (resp.status === 200) {
          const resp_json = await resp.json();
          window.console.log(resp_json);

          this.loaded_evidence = resp_json.statements[this.hash].evidence;
          this.loaded = true;
          this.load_failure = null;
        } else {
          this.load_failure = `(${resp.status}) ${resp.statusText}`;
          success = false;
        }

        this.searching = false;
        return success;
      },
      toggleList: function() {
        if (this.evidence == null || this.evidence.length === 0 )
           if (this.loadable)
             this.getMore();

        this.show_list = !this.show_list;
      },
    },
    computed: {
      show_load_more: function() {
        return this.show_buttons || (
          this.loadable
          && !this.loaded
          && this.total_evidence > this.list_shown.length
          && this.list_shown.length
        )
      },
      base_list: function() {
        if (this.loaded_evidence)
          return this.loaded_evidence;
        else
          return this.evidence;
      },
      total_curations: function() {
        if (this.num_curations != null)
          return this.num_curations;
        let total_curations = 0;
        for (let ev_id in this.evidence.slice(0, this.end_n)) {
          total_curations += this.evidence[ev_id].num_curations > 0;
        }
        return total_curations;
      },
      num_evidence: function() {
        let ret = '';
        if ( !this.show_total_ev_only ) {
          let n = 0;
          if (this.loaded_evidence != null)
            n += this.loaded_evidence.length;
          else if (this.evidence != null)
            n += this.evidence.length;
          ret += n;
        } else {
          ret += 0;
        }

        if (this.total_evidence)
          if ( !this.show_total_ev_only )
            ret += `/${this.total_evidence}`;
          else
            ret += this.total_evidence;
        return ret;
      },
      evidence_url: function() {
        if (this.stmt_hash_url)
          return this.stmt_hash_url;
        return this.$stmt_hash_url
      },
      displayed_badges: function() {
        if (this.badges) {
          let badges = []
          for (let badge of this.badges) {
            if (badge.label === 'evidence') {
              badge['num'] = this.num_evidence;
            }
            if (badge.num) {
              badges.push(badge)
            }
          }
          return badges;
        } else {
          if (!this.sources) {
            return [
              {label: 'evidence', num: this.num_evidence, color: 'grey'},
              {label: 'curations', num: this.total_curations, symbol: '\u270E',
               color: '#28a745'}
              ];
          } else if (this.total_curations) {
            return [
              {label: 'curations', num: this.total_curations, color: '#28a745'}
              ];
          } else {
            return [];
          }
        }
      }

    },
    mixins: [piecemeal_mixin]
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
  }
  .clickable:hover {
    background-color: #e0e0e9;
  }
  .ev-list {
    margin-bottom: 1em;
  }
</style>