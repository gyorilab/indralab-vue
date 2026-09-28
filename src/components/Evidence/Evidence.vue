<template>
  <div class='container evidence nvm'>
    <hr>
    <div class='row nvm'>
      <div class='col-1'>
        <div class='row'>
          <div class='col-3 nvm clickable text-center'
               :class="`${this.curation_badge}`"
               v-on:click='toggleCuration'
               :title='num_curations'
               :style="`color: ${this.icon_color};`">
            &#9998;
          </div>
          <div class='col-9 nvm src-api'>
            {{ source_api }}
          </div>
        </div>
      </div>
      <div class='col-10'>
        <span v-html='always_text'></span>
        <span v-if="llm_verification && llm_verification.verdict"
              class="llm-verification">
          <small class="badge badge-pill"
                 :class="llm_verification.verdict === 'correct'
                   ? 'badge-success' : 'badge-danger'"
                 tabindex="0">
            {{ llm_verification.verdict === 'incorrect' &&
               llm_verification.error_category
               ? llm_verification.error_category
               : llm_verification.verdict }}
          </small>
          <span class="llm-verification-tooltip" role="tooltip">
            <strong>LLM verified {{ llm_verification.verdict }}</strong>
            <span v-if="llm_verification.error_category"
                  class="llm-verification-line">
              <strong>Error category:</strong>
              {{ llm_verification.error_category }}
            </span>
            <span class="llm-verification-line">
              {{ llm_verification.explanation || 'No explanation available.' }}
            </span>
          </span>
        </span>
      </div>
      <div class='col-1 text-right'>
        <ref-link :text_refs="text_refs"></ref-link>
      </div>
    </div>
    <div class='row'>
      <div class='col'>
        <curation-row
            :open='curation_shown'
            :stmt_hash='stmt_hash'
            :source_hash='source_hash'
            v-model="submission_status"
            :ev_json="original_json"
            :num_prior_curations="num_curations"
        />
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Evidence",
    props: {
      text: String,
      pmid: String,
      source_api: String,
      text_refs: Object,
      num_curations: Number,
      num_correct: {
        type: Number,
        default: null
      },
      num_incorrect: {
        type: Number,
        default: null
      },
      source_hash: String,
      stmt_hash: String,
      original_json: Object,
      llm_verification: Object,
    },
    data: function () {
      return {
        curation_shown: false,
        submission_status: null,
      }
    },
    methods: {
      toggleCuration: function() {
        this.curation_shown = !this.curation_shown
      },
    },
    computed: {
      always_text: function() {
        if (this.text)
          return this.text;
        else
          return '<i>No evidence text available.</i>'
      },

      icon_color: function () {
        switch (this.submission_status) {
          case 'success':
            return '#00ff00';
          case 'failure':
            return '#ff0000';
          case 'unknown failure':
            return '#ff8000';
          case 'timeout':
            return '#58D3F7';
          default:
            return '#000000'
        }
      },

      curation_badge: function() {
        if (this.num_correct > 0) {
          return 'has-curation-badge';
        } else if (this.num_incorrect > 0) {
          return 'has-incorrect-curation-badge';
        } else if (this.num_curations > 0) {
          return 'has-curation-badge';
        } else {
          return '';
        }
      }
    }
  }
</script>

<style scoped>
  .src-api {
    overflow-x: hidden;
  }

  .has-curation-badge {
    background-color: #d3fccf;
    border-radius: 1em;
  }

  .has-incorrect-curation-badge {
    background-color: #ffcccc;
    border-radius: 1em;
  }

  .clickable {
    cursor: pointer;
  }

  .clickable:hover {
    opacity: 0.6;
  }

  .llm-verification {
    cursor: default;
    display: inline-block;
    margin-left: 0.4rem;
    position: relative;
  }

  .llm-verification-tooltip {
    background: white;
    border: 2px solid #0d5aa7;
    border-radius: 0.4rem;
    top: calc(100% + 0.5rem);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    color: #212529;
    display: none;
    font-size: 0.95rem;
    left: 50%;
    line-height: 1.4;
    padding: 0.75rem;
    position: absolute;
    text-align: left;
    transform: translateX(-50%);
    width: 24rem;
    max-width: 75vw;
    z-index: 1000;
  }

  .llm-verification:hover .llm-verification-tooltip,
  .llm-verification:focus-within .llm-verification-tooltip {
    display: block;
  }

  .llm-verification-line {
    display: block;
    margin-top: 0.4rem;
  }
</style>
