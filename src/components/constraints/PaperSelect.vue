<template>
  <span class="paper-select">
    <input class="form-control" v-model="selected_paper"
           placeholder="Enter a paper ID...">
    <select class="form-control" v-model="id_type">
      <option v-for="id_type in id_types"
               :key="id_type"
               :value="id_type">
        {{ id_type }}
      </option>
    </select>
  </span>
</template>

<script>
  export default {
    name: "PaperSelect",
    props: ['value'],
    data: function() {
      return {
        selected_paper: null,
        id_types: ['pmid', 'pmcid', 'doi', 'trid', 'tcid'],
        id_type: 'pmid',
      }
    },
    computed: {
      constraint: function() {
        if (!this.selected_paper)
          return null;
        return {paper_list: [[this.id_type, this.selected_paper]]}
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
  .paper-select {
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
