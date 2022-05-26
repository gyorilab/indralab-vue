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
      <div class='col-10' v-html='always_text'></div>
      <div class='col-1 text-end'>
        <RefLink :text_refs="text_refs"></RefLink>
      </div>
    </div>
    <div class='row'>
      <div class='col'>
        <CurationRow
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
  import {CurationRow, RefLink} from "@";

  export default {
    name: "Evidence",
    components: {CurationRow, RefLink},
    props: {
      text: String,
      pmid: String,
      source_api: String,
      text_refs: {
        type: Object,
        required: true,
      },
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
</style>