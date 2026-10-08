<template>
  <span class="correctness-indicator"
        :title="display.title"
        :aria-label="display.title">
    <span class="correctness-bar" aria-hidden="true">
      <span v-for="segment in 3"
            :key="segment"
            class="correctness-segment"
            :style="{ backgroundColor: segment <= display.level
              ? display.color : '#dee2e6' }"></span>
    </span>
    <span :style="{ color: display.color }">{{ display.label }}</span>
    <span class="correctness-score">{{ display.score }}%</span>
  </span>
</template>

<script>
  export default {
    name: "CorrectnessIndicator",
    props: {
      correctness: {
        type: Object,
        required: true
      }
    },
    computed: {
      display: function() {
        const {correct_count, total_count, percent} = this.correctness;
        let level = 3;
        if (percent <= 33.33)
          level = 1;
        else if (percent <= 66.66 || total_count < 3)
          level = 2;

        const label = ['weak', 'medium', 'strong'][level - 1];
        const score = percent.toFixed(2);
        let title = `${score}% correct (${correct_count}/${total_count} `
          + `evidence items): ${label}`;
        if (percent > 66.66 && total_count < 3)
          title += '; strong requires at least 3 evidence items';

        return {
          level: level,
          label: label,
          score: score,
          title: title,
          color: ['#dc3545', '#f0ad4e', '#28a745'][level - 1]
        };
      }
    }
  }
</script>

<style scoped>
  .correctness-indicator {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: 8px;
    font-size: 0.7rem;
    font-weight: 600;
    vertical-align: middle;
    white-space: nowrap;
  }
  .correctness-bar {
    display: inline-flex;
    gap: 2px;
  }
  .correctness-segment {
    width: 13px;
    height: 9px;
    border-radius: 1px;
    transform: skewX(-18deg);
  }
  .correctness-score {
    color: #6c757d;
    font-variant-numeric: tabular-nums;
  }
</style>
