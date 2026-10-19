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
        <div v-if="llm_verification && llm_verification.verdict"
             class="row">
          <div class="col-12 nvm text-center">
            <span class="llm-verification"
                  :aria-label="`LLM verified ${llm_verification.verdict}`"
                  tabindex="0">
              <span class="badge badge-pill llm-verification-badge"
                    :class="llm_verification.verdict === 'correct'
                      ? 'badge-success' : 'badge-danger'">
                <i class="fas fa-robot llm-model-icon"
                   aria-hidden="true"></i>
                <i v-if="llm_verification.verdict === 'correct'"
                   class="fas fa-check llm-result-icon"
                   aria-hidden="true"></i>
                <span v-else-if="llm_verification.error_category ===
                                 'entity_boundaries'"
                      class="llm-result-icon llm-boundaries-icon"
                      aria-hidden="true"></span>
                <span v-else-if="llm_verification.error_category === 'grounding'"
                      class="llm-result-icon llm-grounding-icon"
                      aria-hidden="true">
                  <i class="fas fa-bullseye"></i>
                  <i class="fas fa-mouse-pointer"></i>
                </span>
                <svg v-else-if="llm_verification.error_category ===
                                'wrong_relation'"
                     class="llm-result-icon llm-custom-result-icon"
                     viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12h6m4 0h10m-5-5 5 5-5 5"/>
                </svg>
                <svg v-else-if="llm_verification.error_category ===
                                'act_vs_amt'"
                     class="llm-result-icon llm-custom-result-icon"
                     viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 20h5v-5h5v-5h5V5h5"/>
                </svg>
                <i v-else class="llm-result-icon"
                   :class="llm_result_icon" aria-hidden="true"></i>
              </span>
              <span class="llm-verification-tooltip" role="tooltip">
                <strong>LLM verified {{ llm_verification.verdict }}</strong>
                <span v-if="llm_verification.error_category"
                      class="llm-verification-line">
                  <strong>Error category:</strong>
                  {{ llm_verification.error_category }}
                </span>
                <span class="llm-verification-line">
                  {{ llm_verification.explanation ||
                     'No explanation available.' }}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
      <div class='col-10'>
        <span v-html='always_text'></span>
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
      },

      llm_result_icon: function() {
        const icons = {
          no_relation: 'far fa-times-circle',
          polarity: 'fas fa-exchange-alt',
          agent_conditions: 'fas fa-sliders-h',
          mod_site: 'fas fa-map-marker-alt',
          hypothesis: 'fas fa-question',
          negative_result: 'fas fa-minus-circle',
          other: 'fas fa-ellipsis-h',
        };
        return icons[this.llm_verification.error_category] || 'fas fa-times';
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
    position: relative;
  }

  .llm-verification-badge {
    align-items: center;
    display: inline-flex;
    font-size: 0.8rem;
    gap: 0.35rem;
    padding: 0.3rem 0.5rem;
  }

  .llm-model-icon {
    animation: llm-icon-pulse 2.4s ease-in-out infinite;
  }

  .llm-result-icon {
    display: inline-block;
    line-height: 1;
    position: relative;
    text-align: center;
    width: 1.15em;
  }

  .llm-boundaries-icon {
    border: 0.12em dashed currentColor;
    border-radius: 0.08em;
    height: 0.9em;
    width: 0.9em;
  }

  .llm-custom-result-icon {
    fill: none;
    height: 1em;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2.5;
  }

  .llm-grounding-icon .fa-mouse-pointer {
    bottom: -0.25em;
    font-size: 0.55em;
    position: absolute;
    right: -0.1em;
  }

  @keyframes llm-icon-pulse {
    0%, 100% { opacity: 0.82; }
    50% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .llm-model-icon { animation: none; }
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
    left: 0;
    line-height: 1.4;
    padding: 0.75rem;
    position: absolute;
    text-align: left;
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
