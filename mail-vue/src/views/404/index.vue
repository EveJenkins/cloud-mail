<template>
<div class="box-404">
  <div class="not-found">
    <span class="code">404</span>
    <p class="desc">{{ $t('error404') }}</p>
    <el-button type="primary" @click="router.replace({name: 'layout'})">{{ $t('home') }}</el-button>
  </div>
</div>
</template>

<script lang="js" setup>
import router from "@/router/index.js";
</script>

<style scoped lang="scss">
.box-404 {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--bg);
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.code {
  color: var(--brand-600);
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 2px;
}

.desc {
  margin: 0;
  color: var(--text-3);
  font-size: 13px;
}
</style>
