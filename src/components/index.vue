<template>
  <n-global-style />
  <div class="ai-shell">
    <section class="ai-hero">
      <div class="ai-hero-card">
        <div class="ai-hero-topGlow"></div>
        <div class="ai-hero-layout">
          <div class="ai-hero-panel">
            <p class="token-panel-kicker">卡密激活 / 查询</p>
            <h3 class="token-panel-title">输入 Token 即可激活或查询状态</h3>
            <div class="token-panel-field">
              <div class="token-panel-input">
                <span class="token-input-tag">TOKEN</span>
                <input
                  id="token-input"
                  type="text"
                  v-model.trim="tokenInput"
                  :disabled="activationLoading || queryLoading"
                  placeholder="请输入 Token"
                  @keyup.enter="handleQuery"
                />
              </div>
              <div class="token-panel-actions">
                <button
                  type="button"
                  class="token-btn primary"
                  @click="handleActivation"
                  :disabled="activationLoading || !tokenInput"
                >
                  {{ activationLoading ? '激活中...' : '激活' }}
                </button>
                <button
                  type="button"
                  class="token-btn ghost"
                  @click="handleQuery"
                  :disabled="queryLoading || !tokenInput"
                >
                  {{ queryLoading ? '查询中...' : '查询' }}
                </button>
              </div>
            </div>
            <div class="token-panel-hints">
              <p class="token-panel-hint" :class="{ 'is-error': activationError, 'is-success': activationSuccess }">
                {{
                  activationError ||
                  activationSuccess ||
                  '激活支持月卡或年卡的Token'
                }}
              </p>
              <p class="token-panel-hint" :class="{ 'is-error': queryError }">
                {{ queryError || '如只需查看状态，请直接点击查询按钮' }}
              </p>
            </div>
            <div class="token-panel-card">
              <div class="token-panel-card-label">最新状态</div>
              <div class="token-panel-card-body">
                <div>
                  <span>套餐类型</span>
                  <strong>{{ resultPlanLabel }}</strong>
                </div>
                <div>
                  <span>到期时间</span>
                  <strong>{{ formatExpireTime(latestResult?.expireTime) }}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="ai-hero-content">
            <div class="ai-hero-header">
              <span class="ai-badge">镜像加速</span>
              <h1 class="ai-hero-title">ChatGPT 官方镜像</h1>
            </div>
            <div class="ai-hero-desc">
              <p>
                本站是<span class="desc-em">官网 1:1</span> 的 ChatGPT 镜像，采用高速节点与同款交互体验。
                使用前需 <span class="nowrap"><strong>点击右下方</strong></span> 兑换密钥，兑换后的卡密需
                <span class="desc-highlight">左侧自助激活</span> 才能正式启用。
              </p>
              <br>
              <div class="ai-hero-desc-note">
                <div class="note-row">
                  <span class="note-icon success">✓</span>
                  <div>
                    <strong>镜像站</strong>
                    <p>共享官网的文件/图片解析引擎，原生 UI + 同步功能，默认开启联网与深度思考，适合直接替代官网体验。</p>
                  </div>
                </div>
                <div class="note-row">
                  <span class="note-icon warn">✕</span>
                  <div>
                    <strong>API 站</strong>
                    <p>通常仅提供基础对话能力，文件/图片解析有限，联网功能需另装插件，更多面向程序调用与二次开发。</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="ai-hero-footer">
              <div class="ai-hero-meta">
                <span class="ai-dot"></span>
                <span>图片、文件丝滑上传，官网同款</span>
                <span class="ai-meta-sep"></span>
                <span>高速线路 · 隐私优先 · 零学习成本</span>
              </div>
              <div class="ai-hero-actions">
                <a
                  class="ai-hero-btn"
                  href="https://blog.hgidc.cn/shop/76"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  兑换卡密
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ai-grid">
      <div class="ai-grid-header">
        <div>
          <p class="ai-grid-kicker">节点实时状态</p>
          <h2>可用镜像列表</h2>
        </div>
        <div class="ai-grid-meta">
          <span>已加载 {{ itemslist.length }} / {{ total || '加载中' }} 个站点</span>
        </div>
      </div>

      <div class="ai-grid-section" v-if="plusItems.length">
        <div class="ai-grid-subheader">
          <span class="ai-section-badge plus">PLUS 专区</span>
          <p>高速节点、优先算力、支持团队 TEAM 标签。</p>
        </div>
        <n-grid class="ai-card-grid" x-gap="12" y-gap="12" cols="1 s:2 m:3 l:4 xl:4 2xl:5" responsive="screen">
          <n-grid-item class="cardclss" v-for="item in plusItems" :key="item.carID">
            <n-card
              size="small"
              bordered="false"
              content-style="box-class"
              content-class="box-class"
              @click="redirectTo(item.carID)"
            >
              <div class="card-head">
                <div class="card-badges">
                  <n-button
                    text-color="white"
                    :color="item.isPlus === 0 ? '#19c37d' : '#ab68ff'"
                    type="tertiary"
                    size="small"
                  >
                    {{ item.label }}
                  </n-button>

                  <n-button
                    v-if="item.label.toLowerCase() === 'plus' && item.carID.toLowerCase().startsWith('t')"
                    text-color="white"
                    :color="'#68bceb'"
                    type="tertiary"
                    size="small"
                  >
                    TEAM
                  </n-button>
                </div>
                <n-text class="title">{{ item.carID }}</n-text>
              </div>

              <div class="message-with-dot" :style="{ '--dot-color': customColor(item.color) }">
                状态：{{ item.message?.replaceAll('空闲|', '')?.replaceAll('繁忙|', '') }}
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>

      <div class="ai-grid-section" v-if="freeItems.length">
        <div class="ai-grid-subheader">
          <span class="ai-section-badge free">Free 区</span>
          <p>基础节点覆盖日常使用，支持文件解析与联网。</p>
        </div>
        <n-grid class="ai-card-grid" x-gap="12" y-gap="12" cols="1 s:2 m:3 l:4 xl:4 2xl:5" responsive="screen">
          <n-grid-item class="cardclss" v-for="item in freeItems" :key="item.carID">
            <n-card
              size="small"
              bordered="false"
              content-style="box-class"
              content-class="box-class"
              @click="redirectTo(item.carID)"
            >
              <div class="card-head">
                <div class="card-badges">
                  <n-button
                    text-color="white"
                    :color="item.isPlus === 0 ? '#19c37d' : '#ab68ff'"
                    type="tertiary"
                    size="small"
                  >
                    {{ item.label }}
                  </n-button>
                </div>
                <n-text class="title">{{ item.carID }}</n-text>
              </div>

              <div class="message-with-dot" :style="{ '--dot-color': customColor(item.color) }">
                状态：{{ item.message?.replaceAll('空闲|', '')?.replaceAll('繁忙|', '') }}
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>

      <n-divider
        dashed
        title-placement="center"
        class="ai-divider"
        style="font-size: 14px"
        v-if="itemslist.length < total"
      >
        上拉加载更多
      </n-divider>
    </section>
  </div>
</template>
<script lang="ts">

function uniqueArrayObjects(arr) {
  const jsonObjectSet = new Set();
  const uniqueArray = [];

  arr.forEach(item => {
    const jsonString = JSON.stringify(item);
    if (!jsonObjectSet.has(jsonString)) {
      jsonObjectSet.add(jsonString);
      uniqueArray.push(item);
    }
  });

  return uniqueArray;
}

const isDev = import.meta.env.MODE === 'development'
const tokenApiBase = import.meta.env.VITE_TOKEN_API || (isDev ? '/token-api' : '/token-api')

import axios from 'axios';
import { useLoadingBar } from 'naive-ui'
export default {
  data() {
    return {
      itemslist: [],
      itemsplus: [],
      total: 0,
      page: 1,
      isLoading: false,
      hasMoreData: true,
      minPage: 50,
      loadingBar: null,
      tokenInput: '',
      activationResult: null,
      activationLoading: false,
      activationError: '',
      activationSuccess: '',
      queryResult: null,
      queryLoading: false,
      queryError: ''
    };
  },
  mounted() {
    this.fetchData();
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },

  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('scroll', this.handleScroll);
  },

  computed: {
    plusItems() {
      return (this.itemslist || []).filter(item => Number(item?.isPlus) !== 0);
    },
    freeItems() {
      return (this.itemslist || []).filter(item => Number(item?.isPlus) === 0);
    },
    latestResult() {
      return this.activationResult || this.queryResult;
    },
    resultPlanLabel() {
      return this.resolvePlanLabel(this.latestResult);
    }
  },

  methods: {
    handleVisibilityChange() {
      if (!document.hidden) {
        /**
         * 3-27：强制更新
         * 3-30： 关闭，太费带宽
         */
        // this.updateEndpointStatus(this.itemslist, true)
      }
    },
    async updateEndpointStatus(list, forkUpdate = false) {
      try {
        let baseUrl = isDev ? '/api' : '';
        let promises = list.map(item => {
          let carname = encodeURIComponent(`${item.carID}`);
          let requestUrl = `${baseUrl}/endpoint?carid=${carname}`;
          return fetch(requestUrl)
            .then(response => response.json())
            .then(data => {
              return { ...item, ...data };
            })
            .catch(error => {
              console.error('Error fetching icon data:', error);
              return item; // 发生错误时返回未修改的 item
            });
        });
        return Promise.all(promises).then(newItems => {
          if (forkUpdate) {
            this.itemslist = uniqueArrayObjects(newItems);
          } else {
            this.itemslist = uniqueArrayObjects([...this.itemslist, ...newItems]);
          }
        });
      } catch (e) {
        console.error('请求错误:', e);
      }
    },
    customColor(c) {
      return c === 'yellow' ? '#ffc70b' : c;
    },
    fetchData() {
      if (!this.hasMoreData || this.isLoading) return; // 如果没有更多数据或正在加载，则不执行任何操作

      if (!this.loadingBar) {
        this.loadingBar = useLoadingBar();
      }
      this.loadingBar.start()

      this.isLoading = true;
      axios.post(isDev ? '/api/carpage' : '/carpage', {
        page: this.page,
        size: this.minPage
      })
        .then(async response => {
          if (response.data.data.list === null) {
            this.hasMoreData = false;
            return;
          }
          this.total = response.data?.data?.pagination?.total ?? 0;

          this.page += 1;
          await this.updateEndpointStatus(response.data?.data?.list);
          this.loadingBar.finish()
        })
        .catch(error => {
          console.error('请求错误:', error);
          this.loadingBar.error()
        })
        .finally(() => {
          this.isLoading = false;

          this.loadingBar.finish()
        });
    },
    handleScroll() {
      const nearBottomOfPage = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (nearBottomOfPage && !this.isLoading) {
        // console.log('handleScroll')
        this.fetchData();
      }
    },
    redirectTo(carID) {
      window.location.href = `${window.location.origin
      }/auth/login?carid=${encodeURI(carID)}`;
    },
    handleActivation() {
      const token = this.tokenInput?.trim();

      if (!token) {
        this.activationError = '请输入有效的 Token';
        this.activationSuccess = '';
        this.activationResult = null;
        return;
      }

      this.activationLoading = true;
      this.activationError = '';
      this.activationSuccess = '';

      axios.post(`${tokenApiBase}/activate`, { token })
        .then(response => {
          this.activationResult = response.data || null;
          const expireText = this.formatExpireTime(this.activationResult?.expireTime);
          this.activationSuccess = expireText && expireText !== '—'
            ? `激活成功，有效期至 ${expireText}`
            : '激活成功';
          this.queryResult = response.data || null;
          this.queryError = '';
        })
        .catch(error => {
          const message = error?.response?.data?.message || '激活失败，请稍后重试';
          this.activationError = message;
          this.activationResult = null;
        })
        .finally(() => {
          this.activationLoading = false;
        });
    },
    handleQuery() {
      const token = this.tokenInput?.trim();

      if (!token) {
        this.queryError = '请输入有效的 Token';
        this.queryResult = null;
        return;
      }

      this.queryLoading = true;
      this.queryError = '';

      axios.get(`${tokenApiBase}/token-info`, {
        params: { token }
      })
        .then(response => {
          this.queryResult = response.data || null;
        })
        .catch(error => {
          const message = error?.response?.data?.message || '查询失败，请稍后重试';
          this.queryError = message;
          this.queryResult = null;
        })
        .finally(() => {
          this.queryLoading = false;
        });
    },
    resolvePlanLabel(info) {
      if (!info) return '—';

      const label =
        info.planLabel ??
        info.packageType ??
        info.planType ??
        info.plan ??
        info.comboType ??
        info.package ??
        info.level ??
        info.type ??
        info.remark ??
        null;

      if (label) return label;

      if (typeof info.isPlus === 'number') {
        return info.isPlus === 1 ? 'Plus 套餐' : '标准套餐';
      }

      return '—';
    },
    formatExpireTime(value) {
      if (!value) return '—';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      const pad = (num) => String(num).padStart(2, '0');
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      return `${yyyy}-${mm}-${dd}`;
    }
  }
};

</script>



<style>
.nowrap {
  white-space: nowrap;
}

.ai-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.ai-hero {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  width: 100%;
}

.ai-hero-card {
  position: relative;
  width: 100%;
  border-radius: 24px;
  padding: 26px 22px 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 25px 70px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 640px) {
  .ai-hero-card {
    padding: 36px 40px 32px;
  }
}

.ai-hero-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 960px) {
  .ai-hero-layout {
    flex-direction: row;
    align-items: stretch;
  }
}

.ai-hero-panel {
  flex: 0 0 100%;
  border-radius: 20px;
  padding: 20px 18px 22px;
  background: rgba(5, 9, 18, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@media (min-width: 960px) {
  .ai-hero-panel {
    flex: 0 0 320px;
  }
}

@media (min-width: 1200px) {
  .ai-hero-panel {
    flex-basis: 340px;
  }
}

.ai-hero-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-hero-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 640px) {
  .ai-hero-footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
}

.token-panel-kicker {
  font-size: 12px;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  color: #7bbcff;
  margin-bottom: 6px;
}

.token-panel-title {
  font-size: 20px;
  margin: 0 0 18px;
  color: #f8fbff;
}

.token-panel-label {
  font-size: 12px;
  letter-spacing: 0.2px;
  color: #a5b4d6;
  display: block;
  margin-bottom: 6px;
}

.token-panel-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.token-panel-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.token-btn {
  flex: 1;
  min-width: 90px;
  height: 42px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.25s ease, opacity 0.2s ease;
}

.token-btn.primary {
  color: #fff;
  background: linear-gradient(135deg, #00d9ff 0%, #5b7cff 50%, #a34bff 100%);
  box-shadow:
    0 12px 28px rgba(83, 121, 255, 0.35),
    0 8px 16px rgba(0, 0, 0, 0.25);
}

.token-btn.ghost {
  color: #d1ddff;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.token-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.token-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.token-panel-hints {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-panel-input {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  min-height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(161, 248, 255, 0.25);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
}

.token-panel-input::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(161, 248, 255, 0.45), rgba(83, 121, 255, 0.2));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.35;
}

.token-input-tag {
  font-size: 12px;
  letter-spacing: 0.4px;
  color: #80e8ff;
  text-transform: uppercase;
  font-weight: 700;
}

.token-panel-input input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 15px;
  letter-spacing: 0.3px;
  padding: 8px 0;
}

.token-panel-input input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.token-panel-input input:focus {
  outline: none;
}

.token-panel-input input:disabled {
  opacity: 0.6;
}

.token-panel-hint {
  margin-top: 2px;
  font-size: 12px;
  color: #8fa7d6;
}

.token-panel-hint.is-error {
  color: #ff9b9b;
}

.token-panel-hint.is-success {
  color: #6ff6cf;
}

.token-panel-card {
  margin-top: 18px;
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.token-panel-card-label {
  font-size: 12px;
  color: #7bbcff;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.token-panel-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.token-panel-card-body div {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #d4e2ff;
}

.token-panel-card-body span {
  font-size: 12px;
  color: #8fa0c5;
}

.token-panel-card-body strong {
  font-size: 15px;
  color: #f8fbff;
}

.ai-hero-topGlow {
  position: absolute;
  inset: -50% -20% auto -20%;
  height: 130%;
  pointer-events: none;
  background: conic-gradient(
    from 220deg at 50% 50%,
    rgba(0, 255, 179, 0.25),
    rgba(0, 119, 255, 0.18),
    rgba(255, 0, 153, 0.22),
    rgba(0, 0, 0, 0) 70%
  );
  filter: blur(32px);
  opacity: 0.75;
  transform: translateY(-6%);
}

.ai-hero-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ai-badge {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 6px 12px;
  border-radius: 999px;
  color: #0b1a2b;
  background: linear-gradient(135deg, #a1f8ff, #8dffcf);
  box-shadow:
    0 6px 20px rgba(141, 255, 207, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.ai-hero-title {
  font-size: clamp(24px, 3vw, 34px);
  margin: 0;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: 0.2px;
  background: linear-gradient(95deg, #ffffff 0%, #cfe8ff 60%, #9ad6ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ai-hero-desc {
  font-size: clamp(14px, 2.4vw, 16px);
  color: #d5dbe3;
  line-height: 1.8;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-hero-desc p {
  margin: 0;
}

.ai-hero-desc strong {
  color: #ffffff;
  font-weight: 700;
}

.ai-hero-desc .desc-em {
  background: linear-gradient(95deg, #ffffff 0%, #9ad6ff 60%, #68d1ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.ai-hero-desc .desc-highlight {
  color: #80f8ff;
  font-weight: 700;
}

.ai-hero-desc-note {
  font-size: 13px;
  color: #8fb0d6;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  line-height: 1.7;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.note-row strong {
  color: #dfeeff;
  font-size: 13px;
  letter-spacing: 0.2px;
}

.note-row p {
  margin: 4px 0 0;
  color: #9fc0e2;
  line-height: 1.6;
}

.note-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.note-icon.success {
  background: rgba(77, 246, 192, 0.18);
  color: #4df6c0;
  border: 1px solid rgba(77, 246, 192, 0.4);
}

.note-icon.warn {
  background: rgba(255, 120, 120, 0.15);
  color: #ff9c9c;
  border: 1px solid rgba(255, 120, 120, 0.4);
}

.ai-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 0;
}

.ai-hero-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  height: 46px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-decoration: none;
  color: #ffffff;
  background: linear-gradient(135deg, #00d9ff 0%, #5b7cff 50%, #a34bff 100%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 18px 38px rgba(83, 121, 255, 0.45),
    0 8px 16px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, box-shadow 0.25s ease;
}

.ai-hero-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0 20px 46px rgba(83, 121, 255, 0.55),
    0 10px 18px rgba(0, 0, 0, 0.3);
}

.ai-hero-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  color: #b9c5d8;
  font-size: 13px;
}

.ai-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ffd1, #00a3ff);
  box-shadow:
    0 0 0 3px rgba(0, 255, 209, 0.08),
    0 0 16px rgba(0, 163, 255, 0.45);
}

.ai-meta-sep {
  opacity: 0.6;
}

.ai-grid {
  position: relative;
  border-radius: 28px;
  padding: 30px 18px 24px;
  background: rgba(5, 9, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(14px);
}

@media (min-width: 768px) {
  .ai-grid {
    padding: 42px 32px 32px;
  }
}

.ai-grid-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
}

.ai-grid-kicker {
  font-size: 13px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #7bbcff;
  margin-bottom: 6px;
}

.ai-grid-header h2 {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  margin: 0;
  color: #f6fbff;
}

.ai-grid-meta {
  font-size: 14px;
  color: #96a7cc;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.ai-card-grid {
  margin-top: 26px;
}

.ai-grid-section {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-grid-subheader {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: #96a7cc;
  font-size: 14px;
}

.ai-grid-subheader p {
  margin: 0;
}

.ai-section-badge {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 6px 14px;
  border-radius: 999px;
  color: #0b1a2b;
}

.ai-section-badge.plus {
  background: linear-gradient(135deg, #ffd2ff, #cba5ff);
  color: #481c6b;
}

.ai-section-badge.free {
  background: linear-gradient(135deg, #b5ffe3, #7ce8ff);
  color: #0a2a32;
}

.ai-divider {
  color: #a5b6ff;
}

.ai-divider .n-divider__line {
  background: rgba(255, 255, 255, 0.08);
}

.cardclss {
  position: relative;
  border-radius: 22px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(161, 248, 255, 0.18), rgba(10, 16, 36, 0));
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.cardclss:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.cardclss .n-card {
  border-radius: 20px !important;
  height: 100% !important;
  width: 100% !important;
  border: 1px solid #05070d !important;
  background: linear-gradient(180deg, rgba(12, 18, 36, 0.95), rgba(6, 10, 20, 0.92));
  color: #e6ebff;
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  text-align: left;
  cursor: pointer;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cardclss .title {
  font-weight: 700;
  font-size: 16px;
  color: #f6fbff;
}

.message-with-dot {
  margin-top: 2px;
  position: relative;
  padding-left: 22px;
  color: #a9b6d6;
  font-size: 13px;
}

.message-with-dot:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--dot-color);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 16px rgba(0, 255, 209, 0.35);
}

.box-class {
  border-radius: 18px !important;
}

.n-button {
  border-radius: 999px;
  height: 24px;
  padding: 0 14px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.n-button span {
  font-weight: 800;
}
</style>
