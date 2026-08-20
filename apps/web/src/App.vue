<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { BarChartOutlined, BulbOutlined, DatabaseOutlined, FileTextOutlined, RadarChartOutlined } from '@ant-design/icons-vue';
import { api, type Brand, type Detection, type Opportunity, type Prompt, type VisibilitySummary } from './api';

const active = ref('overview'); const loading = ref(false); const error = ref('');
const brands = ref<Brand[]>([]); const prompts = ref<Prompt[]>([]); const detections = ref<Detection[]>([]);
const summary = ref<VisibilitySummary>({ sampleSize: 0, mentionRate: null, averageRank: null, citationCount: 0, citationDomains: [] });
const brandForm = reactive({ name: '', website: '', aliases: '' });
const promptForm = reactive({ question: '', intent: 'commercial', priority: 50, tags: '' });
const selectedPrompt = ref<string>(); const selectedBrand = ref<string>();
const opportunityBrand = ref<string>(); const opportunities = ref<Opportunity[]>([]);
const menu = [
  { key: 'overview', label: '数据总览', icon: BarChartOutlined }, { key: 'brands', label: '品牌资产', icon: DatabaseOutlined },
  { key: 'prompts', label: 'Prompt 管理', icon: FileTextOutlined }, { key: 'monitor', label: 'AI 可见度', icon: RadarChartOutlined },
  { key: 'opportunities', label: '机会中心', icon: BulbOutlined },
];
const title = computed(() => menu.find((item) => item.key === active.value)?.label ?? '数据总览');
async function refresh() { loading.value = true; error.value = ''; try { [brands.value, prompts.value, detections.value, summary.value] = await Promise.all([api.brands(), api.prompts(), api.detections(), api.visibility()]); } catch (reason) { error.value = reason instanceof Error ? reason.message : '加载失败'; } finally { loading.value = false; } }
async function createBrand() { await api.createBrand({ name: brandForm.name, website: brandForm.website || null, aliases: brandForm.aliases.split(',').map((x) => x.trim()).filter(Boolean) }); Object.assign(brandForm, { name: '', website: '', aliases: '' }); await refresh(); }
async function createPrompt() { await api.createPrompt({ ...promptForm, tags: promptForm.tags.split(',').map((x) => x.trim()).filter(Boolean) }); Object.assign(promptForm, { question: '', intent: 'commercial', priority: 50, tags: '' }); await refresh(); }
async function runDetection() { const brand = brands.value.find((item) => item.id === selectedBrand.value); if (!brand || !selectedPrompt.value) return; await api.detect({ promptId: selectedPrompt.value, provider: 'mock', brands: [{ id: brand.id, name: brand.name, aliases: brand.aliases, kind: 'brand' }] }); await refresh(); }
async function loadOpportunities() { if (opportunityBrand.value) opportunities.value = await api.opportunities(opportunityBrand.value); }
onMounted(refresh);
</script>

<template>
  <a-layout class="shell">
    <a-layout-sider width="224" theme="dark"><div class="brand"><span class="brand-mark">G</span><span>GEOv4</span></div><a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="({ key }: { key: string | number }) => active = String(key)"><a-menu-item v-for="item in menu" :key="item.key"><component :is="item.icon" /><span>{{ item.label }}</span></a-menu-item></a-menu></a-layout-sider>
    <a-layout><a-layout-header class="header"><div><strong>{{ title }}</strong><span class="crumb">真实数据 · 可追溯结果</span></div><a-button :loading="loading" @click="refresh">刷新数据</a-button></a-layout-header>
      <a-layout-content class="content"><a-alert v-if="error" :message="error" type="error" show-icon closable class="notice" />
        <template v-if="active === 'overview'">
          <section class="hero"><div><div class="eyebrow">AI SEARCH INTELLIGENCE</div><h1>从监测到增长机会</h1><p>所有指标都来自已持久化的真实检测；模拟数据不会污染生产指标。</p></div><a-button type="primary" size="large" @click="active = 'monitor'">运行检测</a-button></section>
          <a-row :gutter="16"><a-col :span="6"><a-card><div class="metric-label">有效检测</div><div class="metric-value">{{ summary.sampleSize }}</div><div class="metric-note">不含模拟数据</div></a-card></a-col><a-col :span="6"><a-card><div class="metric-label">品牌提及率</div><div class="metric-value">{{ summary.mentionRate === null ? '—' : `${Math.round(summary.mentionRate * 100)}%` }}</div><div class="metric-note">成功样本覆盖率</div></a-card></a-col><a-col :span="6"><a-card><div class="metric-label">平均排名</div><div class="metric-value">{{ summary.averageRank?.toFixed(1) ?? '—' }}</div><div class="metric-note">越低越好</div></a-card></a-col><a-col :span="6"><a-card><div class="metric-label">有效引用</div><div class="metric-value">{{ summary.citationCount }}</div><div class="metric-note">{{ summary.citationDomains.length }} 个来源域名</div></a-card></a-col></a-row>
          <a-empty v-if="!summary.sampleSize" description="创建品牌和 Prompt 后运行首次真实检测" class="empty-panel" />
        </template>
        <a-card v-else-if="active === 'brands'" title="品牌资产"><a-form layout="inline" class="toolbar" @submit.prevent="createBrand"><a-form-item><a-input v-model:value="brandForm.name" placeholder="品牌名称" /></a-form-item><a-form-item><a-input v-model:value="brandForm.website" placeholder="https://品牌官网" /></a-form-item><a-form-item><a-input v-model:value="brandForm.aliases" placeholder="别名，逗号分隔" /></a-form-item><a-button html-type="submit" type="primary" :disabled="!brandForm.name">添加品牌</a-button></a-form><a-table :dataSource="brands" rowKey="id" :pagination="false" :columns="[{title:'品牌',dataIndex:'name'},{title:'官网',dataIndex:'website'},{title:'别名',dataIndex:'aliases'},{title:'语言',dataIndex:'locale'}]" /></a-card>
        <a-card v-else-if="active === 'prompts'" title="Prompt 管理"><a-form layout="inline" class="toolbar" @submit.prevent="createPrompt"><a-form-item><a-input v-model:value="promptForm.question" placeholder="用户会向 AI 提什么问题？" class="question-input" /></a-form-item><a-form-item><a-select v-model:value="promptForm.intent" style="width:130px" :options="['informational','commercial','transactional','navigational'].map(value => ({value,label:value}))" /></a-form-item><a-form-item><a-input v-model:value="promptForm.tags" placeholder="标签，逗号分隔" /></a-form-item><a-button html-type="submit" type="primary" :disabled="!promptForm.question">添加 Prompt</a-button></a-form><a-table :dataSource="prompts" rowKey="id" :pagination="false" :columns="[{title:'问题',dataIndex:'question'},{title:'意图',dataIndex:'intent'},{title:'优先级',dataIndex:'priority'},{title:'标签',dataIndex:'tags'}]" /></a-card>
        <template v-else-if="active === 'monitor'"><a-card title="运行 AI 可见度检测" class="run-card"><a-space><a-select v-model:value="selectedPrompt" placeholder="选择 Prompt" style="width:360px" :options="prompts.filter(item => item.active).map(item => ({value:item.id,label:item.question}))" /><a-select v-model:value="selectedBrand" placeholder="选择品牌" style="width:220px" :options="brands.filter(item => !item.archived).map(item => ({value:item.id,label:item.name}))" /><a-button type="primary" :disabled="!selectedPrompt || !selectedBrand" @click="runDetection">运行可追溯模拟检测</a-button></a-space><div class="disclaimer">模拟结果明确标记 isMock=true，不计入真实可见度总览。</div></a-card><a-card title="检测记录"><a-table :dataSource="detections" rowKey="id" :columns="[{title:'Provider',dataIndex:'provider'},{title:'模型',dataIndex:'model'},{title:'状态',dataIndex:'status'},{title:'模拟',dataIndex:'isMock'},{title:'Prompt ID',dataIndex:'promptId'}]" /></a-card></template>
        <a-card v-else title="竞争差距与机会"><a-space class="opportunity-filter"><a-select v-model:value="opportunityBrand" placeholder="选择要分析的品牌" style="width:260px" :options="brands.filter(item => !item.archived).map(item => ({value:item.id,label:item.name}))" /><a-button type="primary" :disabled="!opportunityBrand" @click="loadOpportunities">生成机会清单</a-button></a-space><a-alert message="机会分数 = 未提及率 × Prompt 优先级；没有真实样本时不生成伪分数。" type="info" show-icon class="notice" /><a-table :dataSource="opportunities" rowKey="promptId" :columns="[{title:'Prompt',dataIndex:'question'},{title:'意图',dataIndex:'intent'},{title:'样本',dataIndex:'sampleSize'},{title:'已提及',dataIndex:'mentionCount'},{title:'差距率',dataIndex:'gapRate'},{title:'机会分数',dataIndex:'score'}]" /></a-card>
      </a-layout-content></a-layout>
  </a-layout>
</template>
