<template>
  <span class="type-select">
    <select class="form-control" v-model="selected_type">
      <option :value="null" selected disabled hidden>Select type...</option>
      <option v-for="type_name in type_options"
              :value="type_name"
              :key="type_name">
        {{ type_name }}
      </option>
    </select>
    <span class="form-check">
      <input type="checkbox" class="form-check-input" id="inc_subtypes"
             v-model="include_subclasses">
      <label class="form-check-label" for="inc_subtypes">Include subtypes</label>
    </span>
  </span>
</template>

<script>
  export default {
    name: "TypeSelect",
    props: ['value'],
    data: function() {
      return {
        type_options: this.$stmt_types,
        include_subclasses: null,
        selected_type: null,
      }
    },
    computed: {
      constraint: function() {
        if (!this.selected_type)
          return null;
        return {
          stmt_types: [this.selected_type],
          include_subclasses: this.include_subclasses
        }
      }
    },
    watch: {
      constraint: function(constraint) {
        this.$emit('input', constraint);
      }
    }
  }
</script>

<style scoped>
  .type-select {
    margin: 0.2em;
  }
  select, input, button {
    margin: 0.2em;
  }
  .label {
    margin-left: 0.5em;
    margin-right: 0.2em;
  }
</style>
