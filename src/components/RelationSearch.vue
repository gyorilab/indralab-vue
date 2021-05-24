<template>
  <div class='relation-search nvm'
       :style="`cursor: ${(searching) ? 'progress': 'auto'};`">
    <div id="search-row">
      <div class="nav-btn">
        <h4>
          Query Constraints
          <button class="btn"
                  :disabled="cannotGoBack"
                  @click="backButton">
            &lt; Back
          </button>
          <button class="btn"
                  :disabled="cannotGoForward"
                  @click="forwardButton">
            Forward &gt;
          </button>
        </h4>
      </div>
      <div id='seach-box'>
        <div class="form-inline"
             v-for="(constraint, const_idx) in constraints"
             :key='const_idx'>
          <span v-if="!constraint.class">
            <span class='spaced'>
                &#10133;
            </span>
            <select class="form-control"
                    @input="reactToConstraintSelection($event)">
              <option :value="null" selected hidden>
                select constraint...
              </option>
              <option v-for="(type_val, type_name) in constraint_classes"
                      :key="type_name"
                      :value="type_val">
                {{ type_name }} constraint
              </option>
            </select>
          </span>
          <span v-else>
            <span class='spaced click'
                  @click='removeConstraint(const_idx)'>
                &#10005;
            </span>
            <span v-if="constraint.class === 'HasAgent'">
              <b>Agent:</b><agent-select v-model="constraint.constraint"></agent-select>
            </span>
            <span v-else-if="constraint.class === 'HasType'">
              <b>Type:</b><type-select v-model="constraint.constraint"></type-select>
            </span>
            <span v-else-if="constraint.class === 'FromMeshIds'">
              <b>Mesh:</b><mesh-select v-model="constraint.constraint"></mesh-select>
            </span>
            <span v-else-if="constraint.class === 'FromPapers'">
              <b>Paper:</b><paper-select v-model="constraint.constraint"></paper-select>
            </span>
            <span v-else>
              <b style="color: red;">Developer error: unhandled constraint.class.</b>
            </span>
          </span>
        </div>
        <div>
          <button class="btn btn-primary"
                  @click='searchButton'
                  :disabled="searching">
            Search
          </button>
        </div>
      </div>
    </div>
    <div id="error-box" class="nvm" v-show="search_error">
      <hr>
      <i style="color: red">Failed to load search results: {{ search_error }}.</i>
    </div>
    <div id='result-box' class='nvm' v-if='!empty_relations'>
      <hr>
      <h4>Results</h4>
      <small>I found statements that {{ query_string }}</small>
      <hr>
      <h4 v-show='empty_relations & search_history'>Nothing found.</h4>
      <div id="result-list">
        <span v-for="agent_pair in list_shown" :key="agent_pair.id">
          <agent-pair v-bind="agent_pair" :context_queries="context_queries"></agent-pair>
        </span>
      </div>
      <span v-show="searching">Loading...</span>
    </div>
    <div v-else-if="agent_pairs !== null">
      No results found.
    </div>
  </div>
</template>

<script>
  import piecemeal_mixin from "./mixins/piecemeal_mixin";
  import { AgentSelect, MeshSelect, PaperSelect, TypeSelect } from "./constraints";

  export default {
    name: "RelationSearch",
    components: [AgentSelect, MeshSelect, PaperSelect, TypeSelect],
    props: {
      autoload: {
        type: Boolean,
        default: true
      }
    },
    data: function() {
      return {
        new_const_type: null,
        constraints: {},
        cidx: 0,
        constraint_classes: {
          agent: 'HasAgent',
          type: 'HasType',
          mesh: 'FromMeshIds',
          paper: 'FromPapers'
        },
        context_queries: null,
        agent_pairs: null,
        show_search: true,
        searching: false,
        query_string: null,
        next_offset: 0,
        search_error: null,
        search_history: [],
        history_idx: -1,
        complexes_covered: null,
      }
    },
    methods: {
      addConstraint: function(constraint_class) {
        this.$set(this.constraints, this.cidx, {
          class: constraint_class,
          constraint: null,
          inverted: false
        });
        this.cidx ++;
      },

      reactToConstraintSelection: function(event) {
        window.console.log(event);
        this.$set(this.constraints[this.cidx - 1], 'class', event.target.value);
        this.addConstraint(null);
      },

      removeConstraint: function(constraint_idx) {
        this.$delete(this.constraints, constraint_idx)
      },

      searchButton: async function() {
        let query;
        for (let cidx in this.constraints) {
            query = this.constraints[cidx];
            if (!query.class)
              continue
            if (!query.constraint) {
                alert(`Please fill out ${query.class} form completely.`);
                return;
            }
        }
        this.next_offset = 0;
        this.agent_pairs = null;
        this.complexes_covered = null;
        this.pushHistory();
        return await this.search()
      },

      search: async function() {
        // Don't run multiple searches at once.
        if (this.searching)
          return false;

        // If the database says there is nothing more to find, stop looking.
        if (this.next_offset == null) {
          window.console.log("Offset is null, ignoring search.");
          return false;
        }

        this.searching = true;
        let query_strs = [];
        this.context_queries = [];

        // Format the constraints into the query.
        let query_jsons = [];
        let cumulative_queries = {};
        for (let idx in this.constraints) {
          window.console.log(`Processing constraint ${idx}`);

          // Add the param to the query JSON
          let param = this.constraints[idx];
          let constraint = param.constraint;
          if (param.class === 'HasAgent')
            query_jsons.push(param);
          else if (param.class !== null) {
            for (let [class_name, list_name] of [
              ['HasType', 'stmt_types'],
              ['FromMeshIds', 'mesh_ids'],
              ['FromPapers', 'paper_list']
            ]) {
              if (class_name !== param.class)
                continue
              if (class_name in cumulative_queries)
                cumulative_queries[class_name].constraint[list_name]
                  .concat(constraint[list_name]);
              else {
                cumulative_queries[class_name] = param;
                query_jsons.push(param);
              }
            }
          }
        }

        // Build up the context queries.
        this.context_queries = [];
        for (let cn in cumulative_queries) {
          let constraint = cumulative_queries[cn].constraint;
          if (cn === 'FromPapers') {
            let paper_strings = [];
            for (let [id_type, paper_id] of constraint.paper_list){
              paper_strings.push(`${paper_id}@${id_type}`)
            }
            this.context_queries.push(`paper_ids=${paper_strings.join(',')}`);
          } else if (cn === 'FromMeshIds') {
            this.context_queries.push(`mesh_ids=${constraint.mesh_ids.join(',')}`)
          }
        }

        let query;
        if (query_jsons.length === 1)
          query = query_jsons[0];
        else
          query = {
            class: 'Intersection',
            constraint: {query_list: query_jsons},
            inverted: false
          }

        query_strs.push('limit=50');
        query_strs.push(`offset=${this.next_offset}`);
        query_strs.push('with_cur_counts=true');
        query_strs.push('with_english=true');
        query_strs.push('with_hashes=true');
        query_strs.push('format=json-js');
        let query_body = JSON.stringify({
          query: query,
          complexes_covered: this.complexes_covered
        });
        window.console.log(`Query params: ${query_strs}`);
        window.console.log(`JSON query: ${query_body}`);
        window.console.log(`Context queries: ${this.context_queries}`);

        // Make the query
        let url = this.$agent_url + '?' + query_strs.join('&');
        window.console.log(url);
        const resp = await fetch(url, {
          method: 'POST',
          body: query_body,
          headers: {'Content-Type': 'application/json'}
        });

        // Check that the query is good (exit if not)
        if (resp.status !== 200) {
          this.search_error = `(${resp.status}) ${resp.statusText}`;
          this.searching = false;
          return false;
        }
        this.search_error = null;

        // Unpackage the result.
        const resp_json = await resp.json();
        window.console.log(resp_json);

        this.query_string = resp_json.query_str;
        if (!this.agent_pairs)
          this.agent_pairs = resp_json.relations
        else
          this.agent_pairs = [...this.agent_pairs, ...resp_json.relations]
        this.next_offset = resp_json.next_offset;
        this.complexes_covered = resp_json.complexes_covered;

        // Decide whether to close the search box or not.
        if (this.agent_pairs.length > 0)
          this.show_search = false;

        this.searching = false;
        return true;
      },

      pushHistory: function() {
        // Handle case where we've gone back.
        if (this.history_idx !== this.search_history.length)
          this.search_history = this.search_history.slice(0, this.history_idx+1);

        // Push the latest constraint to the end of the history.
        this.search_history.push({constraints: this.deepCopy(this.constraints)});
        this.history_idx += 1;
      },

      backButton: async function() {
        if (this.cannotGoBack)
          return;
        this.history_idx -= 1;
        this.constraints = this.search_history[this.history_idx].constraints;
        this.next_offset = 0;
        this.agent_pairs = null;
        return await this.search();
      },

      forwardButton: async function() {
        if (this.cannotGoForward)
          return;
        this.history_idx += 1;
        this.constraints = this.search_history[this.history_idx].constraints;
        this.next_offset = 0;
        this.agent_pairs = null;
        return await this.search();
      },

      deepCopy: function(inObject) {
        let outObject, value, key;

        if (typeof inObject !== 'object' || inObject === null)
          return inObject;

        outObject = Array.isArray(inObject) ? [] : {};

        for (key in inObject) {
          value = inObject[key];
          outObject[key] = this.deepCopy(value);
        }

        return outObject;
      },

      getMore: async function() {
        return await this.search()
      }
    },
    computed: {
      empty_relations: function() {
        if (this.agent_pairs === null)
          return true;
        return (this.agent_pairs.length === 0);
      },

      base_list: function() {
        return this.agent_pairs;
      },

      cannotGoBack: function() {
        return this.history_idx <= 0;
      },

      cannotGoForward: function() {
       return this.history_idx >= (this.search_history.length - 1);
      },
    },
    created: function() {
      this.addConstraint('HasAgent');
      this.addConstraint(null);
    },
    mixins: [piecemeal_mixin]
  }
</script>

<style scoped>
  .relation-search {
    cursor: pointer
  }
  .click {
    cursor: pointer;
  }

  select, input, button {
    margin: 0.2em;
  }
  .spaced {
    margin: 0 0.5em;
  }

  .nav-btn {
    margin-top: auto;
    margin-bottom: auto;
  }

  .sticky-header {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    padding: 5px 20px 0 20px;
    margin-left: -20px;
    margin-right: -20px;
  }

  #src-disp-hr {
    padding-right: 20px;
    padding-left: 20px;
    margin-bottom: 0;
  }

  #result-list {
    margin-top: 10px;
  }
</style>
