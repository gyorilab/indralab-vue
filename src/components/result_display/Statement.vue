<template>
  <!-- todo: Load prior curations from https://discovery.indra.bio/curation/list/<stmt_hash>/<src_hash> -->
  <div class="statement">
    <!-- toggleList controls showing/hiding the ev-list below -->
    <div class="row clickable" @click="toggleList">
      <div class="col text-left">
        <h5>
          <span v-html="english"></span>
          <small
            v-for="badge in displayed_badges"
            :class="`badge rounded-pill float-${
              badge.loc === 'right' ? 'end' : 'start'
            }`"
            :style="`background-color: ${badge.color}; color: white;`"
            :title="badge.title"
            :key="badge.label"
          >
            <a
              v-if="badge.href"
              :style="`background-color: ${badge.color}; color: white;`"
              :href="badge.href"
              target="_blank"
            >
              {{ badge.symbol }}{{ badge.num }}</a
            >
            <span v-else>{{ badge.symbol }}{{ badge.num }}</span>
          </small>
        </h5>
      </div>
      <div class="col-auto text-right" v-if="sources">
        <SourceDisplay :source_counts="sources"></SourceDisplay>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="ev-list clickable" v-show="show_list">
          <Evidence
            v-for="ev in evidenceShown"
            :key="ev.source_hash"
            :text="ev.text"
            :pmid="ev.pmid || (ev.text_refs && ev.text_refs.PMID)"
            :source_api="ev.source_api"
            :text_refs="ev.text_refs"
            :source_hash="ev.source_hash"
            :stmt_hash="hash"
            :original_json="ev"
          />
          <div class="text-center load-error" v-if="load_failure">
            <i style="color: red"
              >Failed to load more evidence: {{ load_failure }}</i
            >
          </div>
          <div
            class="text-center clickable"
            :style="`cursor: ${searching ? 'progress' : 'pointer'}`"
            v-show="show_load_more"
            @click="loadMore"
          >
            Load {{ remainingSize }} more...
          </div>
          <div
            class="text-center clickable"
            :style="`cursor: ${searching ? 'progress' : 'pointer'}`"
            v-show="show_load_more && show_load_all"
            @click="loadAll"
          >
            Load all {{ total_evidence - evidenceShown.length }} remaining...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Evidence, SourceDisplay} from "@";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Statement",
  components: {
    Evidence,
    SourceDisplay,
  },
  props: {
    // Look into the statement JSON schema:
    // https://raw.githubusercontent.com/sorgerlab/indra/master/indra/resources/statements_schema.json
    // and ajv for validation: https://github.com/ajv-validator/ajv
    // See also: https://json-schema.org/
    evidence: {
      // Caller should pass an empty array if there is no evidence
      type: Array,
      required: true,
    },
    english: String,
    hash: String,
    sources: Object,
    total_evidence: {
      type: Number,
      required: true,
    },
    context_queries: {
      type: Array,
      default: null,
    },
    num_curations: {
      type: Number,
      default: null,
    },
    loadable: {
      type: Boolean,
      default: false,
    },
    init_expanded: {
      type: Boolean,
      default: false,
    },
    show_total_ev_only: {
      type: Boolean,
      default: false,
    },
    stmt_hash_url: {
      // Use to replace the global $stmt_hash_url
      type: String,
      default: null,
    },
    badges: {
      type: Array,
      default: null,
    },
    batchSize: {
      // Batch size for showing more evidence
      type: Number,
      default: 10,
    },
    show_load_all: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      show_list: false,
      searching: false,
      loaded: false,
      loadedEvidence: [], // Store evidence that has been loaded from the server
      load_failure: null,
      evShown: 0, // How many evidences that are currently shown
    };
  },
  created() {
    this.show_list = this.init_expanded;
    if (this.init_expanded) {
      this.evShown = this.evidence.length;
    }
    // this.fetchCurations();  // Todo: cannot fetch curations for just a hash yet, copy implementation from db.indra.bio
  },
  methods: {
    // async fetchCurations() {
    //   if (this.num_curations === null) {
    //     const resp = await fetch(`${this.$curation_list_url}/${this.hash}`, {
    //       method: 'GET',
    //     });
    //     let data;
    //     switch (resp.status) {
    //       case 200:
    //         data = await resp.json();
    //         console.log(data);
    //         this.num_curations = data.length;
    //         break;
    //       case 404:
    //         this.num_curations = 0;
    //         break;
    //       default:
    //         this.load_failure = `Failed to load curation count: ${resp.status}`;
    //         break;
    //     }
    //   }
    // },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    getMore: async function () {
      /**
       * Get more evidence for this statement (e.g. hash)
       */
      if (this.searching || this.loaded) return false;

      this.searching = true;

      let params = [
        "format=json-js",
        "with_english=true",
        "with_cur_counts=true",
        "filter_ev=true",
      ];
      if (this.context_queries !== null)
        params = [...params, ...this.context_queries];

      const resp = await fetch(
        this.evidence_url + this.hash + "?" + params.join("&")
      );
      let success = true;
      window.console.log(resp.status);
      if (resp.status === 200) {
        const resp_json = await resp.json();
        window.console.log(resp_json);

        this.loadedEvidence = resp_json.statements[this.hash].evidence;
        this.loaded = true;
        this.load_failure = null;
      } else {
        this.load_failure = `(${resp.status}) ${resp.statusText}`;
        success = false;
      }

      this.searching = false;
      return success;
    },
    async loadMore() {
      // Controls the action for clicking the "Load (N) more" button
      // If there are more evidences to load, load them

      let num_loaded = 0;

      // If the list is not fully loaded, load more
      if (this.allEvidence.length < this.total_evidence) {
        window.console.log("Getting more...");
        let got_more = await this.getMore();
        if (!got_more) {
          window.console.log("None gotten");
          return;
        } else {
          window.console.log("More gotten.");
        }
      } else {
        window.console.log("No more evidence to get.");
      }

      // Lengthen the list.
      this.evShown += this.batchSize;
      num_loaded += this.batchSize;

      // If we're autoloading, check to see if we need to fill
      // in the page some more.
      if (this.autoload) {
        // fixme: not yet re-implemented from mixins
        await this.sleep(100);
        if (this.bottomVisible()) {
          num_loaded += await this.loadMore();
        }
      }

      return num_loaded;
    },
    async loadAll() {
      // If loading has not been initiated, do so.
      if (!this.loaded) {
        await this.getMore();
      }
      // Increase the number of evidences shown to total_evidence
      this.evShown = this.total_evidence;
    },
    toggleList() {
      // todo: fetch the curations for all the evidence if not already loaded
      if (this.evidence === null || this.evidence.length === 0)
        if (this.loadable) this.getMore();

      this.show_list = !this.show_list;
    },
    getUniqueEvidence(evidenceList) {
      // Get a list of unique evidence.
      let sourceHases = [];
      let uniqueEvidence = [];
      evidenceList.forEach((evidence) => {
        // If we've havent seen this evidence, add it to the list and save the hash.
        if (sourceHases.indexOf(evidence.source_hash) === -1) {
          sourceHases.push(evidence.source_hash);
          uniqueEvidence.push(evidence);
        }
      });
      return uniqueEvidence;
    },
  },
  computed: {
    show_load_more() {
      return this.loadable && this.total_evidence > this.evShown;
    },
    remainingSize() {
      // new
      return Math.min(
        this.batchSize,
        this.total_evidence - this.evidenceShown.length
      );
    },
    allEvidence() {
      // new
      return this.getUniqueEvidence(
        this.evidence.concat(this.loadedEvidence || [])
      );
    },
    evidenceShown() {
      // new
      let evidences;
      // If there is no loaded evidence, return the prop evidence only, if there is any.
      if (this.loadedEvidence === null) {
        evidences = this.evidence || [];
      } else {
        // Otherwise, cobine the loaded evidence with the prop evidence.
        evidences = [...this.evidence, ...this.loadedEvidence];
      }
      // Slice the list of unique evidence to the number of shown evidence.
      return this.getUniqueEvidence(evidences).slice(0, this.evShown);
    },
    base_list() {
      // fixme: is this one needed? Can't we just use evidenceShown?
      if (this.loadedEvidence) return this.loadedEvidence;
      else return this.evidence;
    },
    total_curations() {
      // fixme: this assumes that the evidence prop contains curation data
      if (this.num_curations != null) return this.num_curations;
      let total_curations = 0;
      for (let ev_id in this.evidence.slice(0, this.batchSize)) {
        total_curations += this.evidence[ev_id].num_curations > 0;
      }
      return total_curations;
    },
    num_evidence() {
      let ret = "";
      if (!this.show_total_ev_only) {
        let n = 0;
        if (this.loadedEvidence != null) n += this.loadedEvidence.length;
        else if (this.evidence != null) n += this.evidence.length;
        ret += n;
      } else {
        ret += 0;
      }

      if (this.total_evidence)
        if (!this.show_total_ev_only) ret += `/${this.total_evidence}`;
        else ret += this.total_evidence;
      return ret;
    },
    evidence_url() {
      if (this.stmt_hash_url) return this.stmt_hash_url;
      return this.$stmt_hash_url;
    },
    displayed_badges() {
      if (this.badges) {
        let badges = [];
        for (let badge of this.badges) {
          if (badge.label === "evidence") {
            badge["num"] = this.num_evidence;
          }
          if (badge.num) {
            badges.push(badge);
          }
        }
        return badges;
      } else {
        if (!this.sources) {
          return [
            { label: "evidence", num: this.num_evidence, color: "grey" },
            {
              label: "curations",
              num: this.total_curations,
              symbol: "\u270E",
              color: "#28a745",
            },
          ];
        } else if (this.total_curations) {
          return [
            { label: "curations", num: this.total_curations, color: "#28a745" },
          ];
        } else {
          return [];
        }
      }
    },
  },
};
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
/*.clickable:hover {*/
/*  background-color: #e0e0e9;*/
/*}*/
.ev-list {
  margin-bottom: 1em;
}
</style>
