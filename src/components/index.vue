<template>
  <n-global-style />
  <div class="ai-shell">
    <section class="ai-hero">
      <div class="ai-hero-card">
        <div class="ai-hero-topGlow"></div>
        <div class="ai-hero-header">
          <span class="ai-badge">镜像加速</span>
          <h1 class="ai-hero-title">ChatGPT 官方镜像</h1>
        </div>
        <p class="ai-hero-desc">
          这是 <b>官网 1:1</b> 的 ChatGPT 镜像，采用高速节点与同款交互体验。使用前需
          <span class="nowrap"><strong>100 积分</strong></span> 兑换密钥后方可使用。
        </p>
        <div class="ai-hero-meta">
          <span class="ai-dot"></span>
          <span>密钥一次兑换，账号通用</span>
          <span class="ai-meta-sep">·</span>
          <span>高速线路 · 隐私优先 · 零学习成本</span>
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

      <n-grid class="ai-card-grid" x-gap="12" y-gap="12" cols="1 s:2 m:3 l:4 xl:4 2xl:5" responsive="screen">
        <n-grid-item class="cardclss" v-for="item in itemslist" :key="item.carID">
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
      loadingBar: null
    };
  },
  mounted() {
    this.fetchData();
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },

  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
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
    beforeDestroy() {
      window.removeEventListener('scroll', this.handleScroll);
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
}

.ai-hero-card {
  position: relative;
  width: min(960px, 100%);
  border-radius: 24px;
  padding: 32px 24px 28px;
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
    padding: 42px 48px 34px;
  }
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
  margin-bottom: 20px;
}

.ai-hero-desc strong {
  color: #ffffff;
  font-weight: 700;
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
