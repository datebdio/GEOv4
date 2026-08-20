<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  BarChartOutlined,
  BulbOutlined,
  FileTextOutlined,
  RadarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';

const active = ref('overview');
const menu = [
  { key: 'overview', label: '总览', icon: BarChartOutlined },
  { key: 'monitor', label: 'AI 可见度', icon: RadarChartOutlined },
  { key: 'opportunity', label: '机会中心', icon: BulbOutlined },
  { key: 'content', label: '内容工坊', icon: FileTextOutlined },
  { key: 'settings', label: '系统设置', icon: SettingOutlined },
];
const title = computed(() => menu.find((item) => item.key === active.value)?.label ?? '总览');
function selectMenu(info: { key: string | number }) {
  active.value = String(info.key);
}
</script>

<template>
  <a-layout class="shell">
    <a-layout-sider width="224" theme="dark">
      <div class="brand"><span class="brand-mark">G</span><span>GEOv4</span></div>
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="selectMenu">
        <a-menu-item v-for="item in menu" :key="item.key">
          <component :is="item.icon" /><span>{{ item.label }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <div><strong>{{ title }}</strong><span class="crumb">企业级 GEO Intelligence Platform</span></div>
        <a-tag color="blue">规划基线 · 0.1.0</a-tag>
      </a-layout-header>
      <a-layout-content class="content">
        <template v-if="active === 'overview'">
          <section class="hero">
            <div><div class="eyebrow">AI SEARCH INTELLIGENCE</div><h1>让品牌在 AI 回答中被看见</h1><p>监测品牌提及、引用来源和竞争差距，把真实数据转化为可执行的 GEO 机会。</p></div>
            <a-button type="primary" size="large">创建首次检测</a-button>
          </section>
          <a-row :gutter="16">
            <a-col :span="6" v-for="card in [
              ['监测 Prompt', '0', '等待创建真实 Prompt'],
              ['AI 回答', '0', '未执行真实检测'],
              ['品牌提及率', '—', '需要可比检测数据'],
              ['有效引用', '0', '等待解析来源'],
            ]" :key="card[0]">
              <a-card><div class="metric-label">{{ card[0] }}</div><div class="metric-value">{{ card[1] }}</div><div class="metric-note">{{ card[2] }}</div></a-card>
            </a-col>
          </a-row>
          <a-card class="workflow" title="GEO 增长闭环">
            <a-steps :current="0" :items="['品牌资产','Prompt 管理','AI 检测','机会发现','内容优化','发布追踪'].map(title => ({ title }))" />
          </a-card>
          <a-alert message="当前没有真实业务数据" description="系统不会使用硬编码指标冒充检测结果。完成品牌和 Prompt 配置后，真实结果会出现在这里。" type="info" show-icon />
        </template>
        <a-result v-else status="info" :title="`${title}模块正在按 PRD 实现`" sub-title="第一阶段先打通品牌 → Prompt → 检测 → 原始回答 → 分析的真实闭环。" />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
