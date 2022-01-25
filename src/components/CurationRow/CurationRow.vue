<template>
  <div class='container' v-show='open'>
    <div class='row cchild' style='border-top: 1px solid #FFFFFF;'>
      <div class='col' style='padding: 0px; border-top: 1px solid #FFFFFF;'>
        <div class="form-inline">
          <select class="form-control form-elem"
                  v-model='error_type'>
            <option value='' selected disabled hidden>
              Select error type...
            </option>
            <option v-for='(option_label, option_value) in options'
                    v-bind:value='option_value'
                    :key='option_value'>
              {{ option_label }}
            </option>
          </select>
          <input class="form-control form-elem"
                 type='text'
                 v-model='comment'
                 maxlength='240'
                 name='user_feedback'
                 placeholder='Optional description (240 chars)'
                 value=''
                 style='width: 360px;'>
          <button type='button curation_button form-elem'
                  class='btn btn-secondary pull-right'
                  style='padding: 2px 6px'
                  :disabled='submitting'
                  @click='submitForm'>
            Submit
          </button>
          <span class='message form-elem' v-show="message">
            <i>{{ message }}</i>
          </span>
        </div>
        <div v-if='(previous && previous.length) || error_loading_previous || (no_auth && num_prior_curations > 0)'
             class="curation-panel">
          <h5>
            Prior Curations
            <button type='button'
                    class='btn btn-default btn-submit pull-right'
                    style='padding: 2px 6px'
                    @click='loadPrevious'>
              <img src='https://bigmech.s3.amazonaws.com/indra-db/reload.png'
                   style='width: 1em; height: 1em'>
            </button>
          </h5>
          <hr>
          <div v-if="no_auth">
            <i>Please log in to see previous curations.</i>
          </div>
          <div v-if="error_loading_previous">
            <i style="color: red">Sorry, we could not load previous curations: {{error_loading_previous}}</i>
          </div>
          <div v-if="previous && previous.length">
            <div v-for='entry in previous'
                 :key="entry.date.toISOString()"
                 class='row'>
              <div class='col-3'>
                {{ entry.date.toLocaleString() }}
              </div>
              <div v-for='attr in ["curator", "tag", "text", "source"]'
                   :key="attr"
                   class='col'>
              <span v-if='entry[attr]'>
                {{ entry[attr] }}
              </span>
                <span v-else>
                <i>No {{ attr }} given.</i>
              </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "CurationRow",
    props: {
      value: String,
      open: Boolean,
      source_hash: String,
      ev_json: Object,
      stmt_hash: String,
      num_prior_curations: {
        type: Number,
        required: true,
      }
    },
    data: function() {
      return {
        comment: '',
        error_type: '',
        options: {
          correct: 'Correct',
          entity_boundaries: 'Entity Boundaries',
          grounding: 'Grounding',
          no_relation: 'No Relation',
          wrong_relation: 'Wrong Relation',
          act_vs_amt: 'Activity vs. Amount',
          polarity: 'Polarity',
          negative_result: 'Negative Result',
          hypothesis: 'Hypothesis',
          agent_conditions: 'Agent Conditions',
          mod_site: 'Modification Site',
          other: 'Other...'
        },
        submitting: false,
        message: "",
        previous: null,
        status: null,
        error_loading_previous: null,
        no_auth: false,
      }
    },
    methods: {
      submitForm: function() {
        if (this.submitting)
          return;

        this.submitting = true;
        this.status = 'submitting';
        if (!this.error_type) {
          alert('Please enter an error type or "correct" for the statement in the dropdown menu.');
        } else if (!this.comment && this.error_type === 'other') {
          alert('Please describe the error when using option "other...".');
        } else {
          this.submitCuration();
        }

        this.submitting = false;
        if (this.status === 'submitting')
          this.status = 'unknown failure';
      },

      loadPrevious: function() {
        if (this.num_prior_curations > 0) {
          this.getCurations();
        } else {
          console.log('No prior curations to load.');
        }
      },

      clear: function () {
        this.error_type = "";
        this.comment = "";
      },

      submitCuration: async function() {
        let cur_dict = {
          tag: this.error_type,
          text: this.comment,
          ev_hash: this.source_hash,
          ev_json: this.ev_json,
        };
        let url = this.$curation_url;
        if (this.$curation_url[this.$curation_url.length - 1] !== '/')
          url += '/';
        url += this.stmt_hash;
        const resp = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(cur_dict),
          headers: {'Content-Type': 'application/json'}
        });
        switch (resp.status) {
          case 200:
            this.message = "Curation successful!";
            this.clear();
            this.status = 'success';
            break;
          case 400:
            this.message = resp.status + ": Bad Curation Data";
            this.status = 'failure';
            break;
          case 500:
            this.message = resp.status + ": Internal Server Error";
            this.status = 'failure';
            break;
          case 504:
            this.message = resp.status + ": Server Timeout";
            this.status = 'timeout';
            break;
          case 401:
            this.message = resp.status + ': You are not authorized, please log in.';
            this.status = 'failure';
            break;
          default:
            this.message = resp.status + ': Uncaught error';
            this.status = 'unknown failure';
            break;
        }
      },

      getCurations: async function() {
        const resp = await fetch(`${this.$curation_list_url}/${this.stmt_hash}/${this.source_hash}`, {
          method: 'GET',
        });
        window.console.log('Response Status: ' + resp.status);
        let data;
        switch (resp.status) {
          case 200:
            data = await resp.json();
            for (let entry of data)
              entry.date = new Date(entry.date);
            this.previous = data;
            this.error_loading_previous = null;
            this.no_auth = false;
            break;
          case 401:
            this.no_auth = true;
            break;
          default:
            this.error_loading_previous = `(${resp.status}) ${resp.statusText}`;
            break;
        }
      },
    },
    watch: {
      open: function(newOpen, oldOpen) {
        if (!oldOpen && newOpen && this.previous == null)
          this.getCurations()
      },
      status: function (status) {
        this.$emit('input', status)
      }
    }
  }
</script>

<style scoped>
  .curation-panel {
    border: 1px solid #0d5aa7;
    border-radius: 0.5em;
    padding: 1em;
    margin: 0.5em 0;
  }
  .message {
    color: #606060;
  }
  .form-elem {
    margin: 0 0.5em;
  }

</style>
