<template>
  <span class="relation">
    <div class="row header"
         :style="`cursor: ${(searching) ? 'progress': 'pointer'};`"
         @click="toggleStmts">
      <div class='col text-start'>
        <h5>
          <span v-html="english"></span>
          <small v-if='cur_count'
                 class='badge badge-success rounded-pill'>
            &#9998; {{ cur_count }}
          </small>
        </h5>
      </div>
      <div class="col-auto text-end">
        <SourceDisplay :source_counts="source_counts"></SourceDisplay>
      </div>
    </div>
    <div class="error-message" v-show="search_failed">
      <i style="color: red">Failed to find statements: {{search_failed}}</i>
    </div>
    <div class="row stmt_list" v-show="show_stmts">
      <div class="col">
        <div class="container right-bar">
          <Statement v-for="[hash, stmt] of list_shown"
                     :key="hash"
                     :english="stmt.english"
                     :hash="hash"
                     :loadable="true"
                     :sources="stmt_source_counts[hash]"
                     :num_curations="cur_counts[hash]"
                     :evidence="stmt.evidence"
                     :total_evidence="evidence_counts[hash]"
                     :context_queries="context_queries"
                     :init_expanded="Object.keys(stmts).length === 1"></Statement>
        </div>
        <div class='text-center clickable'
             :style="`cursor: ${(searching) ? 'progress' : 'pointer'}`"
             v-show='show_buttons'
             @click='loadMore'>
          Load {{ next_batch }} more...
        </div>
        <div class='text-center clickable'
             :style="`cursor: ${(searching) ? 'progress' : 'pointer'}`"
             v-show='show_buttons'
             @click='loadAll'>
          Load all {{(base_list ? base_list.length : 0) - end_n }} remaining...
        </div>
      </div>
    </div>
  </span>
</template>

<script>
  import piecemeal_mixin from "../mixins/piecemeal_mixin";
  import {SourceDisplay, Statement} from "@";

  export default {
    name: "Relation",
    components: {Statement, SourceDisplay},
    props: {
      english: String,
      source_counts: Object,
      agents: Object,
      type: String,
      cur_count: {
        type: Number,
        default: 0
      },
      context_queries: Array,
      hashes: Array,
    },
    data: function() {
      return {
        show_stmts: false,
        stmts: null,
        stmt_source_counts: null,
        searching: false,
        cur_counts: null,
        evidence_counts: null,
        search_failed: null,
      }
    },
    methods: {
      toggleStmts: function() {
        if (this.stmts == null)
          this.getStmts();
        this.show_stmts = !this.show_stmts;
      },

      getStmts: async function() {
        if (this.searching)
          return false;

        window.console.log("Getting statements.");
        this.searching = true;

        let query_data = {
          agent_json: this.agents,
          hashes: this.hashes,
          stmt_type: this.type
        };

        let query_strs = [];
        query_strs.push("ev_limit=10");
        query_strs.push("format=json-js");
        query_strs.push("with_english=true");
        query_strs.push("with_cur_counts=true");
        query_strs.push("filter_ev=true");

        let query_str = [...query_strs, ...this.context_queries].join('&');
        window.console.log(this.$stmt_url);
        window.console.log(query_str);
        window.console.log(query_data);
        const resp = await fetch(
          this.$stmt_url + '?' + query_str,
          {
            method: 'POST',
            body: JSON.stringify(query_data),
            headers: {'Content-Type': 'application/json'}
          });
        let success = true;
        if (resp.status === 200) {
          const resp_json = await resp.json();
          window.console.log(resp_json);

          this.stmts = resp_json.statements;
          this.stmt_source_counts = resp_json.source_counts;
          this.cur_counts = resp_json.num_curations;
          this.evidence_counts = resp_json.evidence_counts;
          this.search_failed = null;
        } else {
          this.search_failed = `(${resp.status}) ${resp.statusText}`
          success = false;
        }
        this.searching = false;
        return success;
      }
    },
    computed: {
      base_list: function() {
        if (!this.stmts)
          return null;
        return Object.entries(this.stmts);
      }
    },
    mixins: [piecemeal_mixin]
  }
</script>

<style scoped>
  .header {
    cursor: pointer;
  }
  .header:hover {
    background-color: #e0e0e9;
  }
  .right-bar {
    border-right: #0d5aa7 solid 1px;
  }
</style>