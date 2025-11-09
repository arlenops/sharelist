<template>
  <n-global-style />
  <n-grid class="notice" x-gap="12" :cols="1">
    <n-gi>
      <div class="light-green">
        <div class="notice-content">
          <img :src="noticeImage" alt="ChatGPT 官方镜像" class="notice-image" />
          <div class="notice-text">
            <p class="notice-title">ChatGPT 官方镜像</p>
            <p class="notice-detail">
              禁止涉及黄、赌、毒、政及任何不良行为，否则将会永久封号。
            </p>
          </div>
        </div>
      </div>
    </n-gi>
  </n-grid>
  <n-grid x-gap="10" y-gap="10" cols="2 s:3 m:4 l:5 xl:5 2xl:6" responsive="screen">
    <n-grid-item class="cardclss" v-for="item in itemslist" :key="item.carID">
      <n-card size="small" bordered="false" content-style="box-class" content-class="box-class"
              @click="redirectTo(item.carID)">
        <div style="display: flex;align-items: center;justify-content: space-between;">
          <div style="display: flex;align-items: center;">
            <n-button text-color="white" :color="item.isPlus === 0 ? '#19c37d' : '#ab68ff'" type="tertiary"
                      size="small">
              {{ item.label }}
            </n-button>

            <n-button v-if="item.label.toLowerCase() === 'plus' && item.carID.toLowerCase().startsWith('t')"
                      text-color="white" :color="'#68bceb'" type="tertiary" size="small" style="margin-left: 4px">
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

  <n-divider dashed title-placement="center" style="font-size: 14px" v-if="itemslist.length < total">
    上拉加载更多
  </n-divider>


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
import gptImage from '../assets/gpt.png'
export default {
  data() {
    return {
      itemslist: [],
      itemsplus: [],
      noticeImage: gptImage,
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
#app {
  padding: 0 10px 10px 10px;
}

.n-button {
  border-radius: 7px;
}

.n-gradient-text {
  margin-top: 10px;
}

.message-with-dot {
  margin-top: 10px;
  position: relative;
  padding-left: 20px;
  color: gray;
  font-size: 12px;
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
  border: 1px #e7eeed solid;
}


.box-class {
  border-radius: 10px !important;

}

.box-class .status {
  margin-top: 10px;
}

.box-class:hover {
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.n-button {
  width: 50px;
  height: 20px;
  line-height: 20px;
  font-size: 10px;
}

.n-button span {
  font-weight: 800;
}

.cardclss .title {
  font-weight: 600;
  margin-left: 5px;
}

.notice {
  /*color: #67c23a;*/
  border-radius: 10px !important;
  margin-bottom: 20px;
}

.light-green {
  padding: 0 20px 20px 20px;
  border-radius: 10px;
  background: none;
}

.notice-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  border-radius: 10px;
  padding: 16px 0;
}

.notice-image {
  width: 80vw;
  max-width: 960px;
  height: auto;
  object-fit: contain;
}

.notice-text {
  color: #2c3e50;
  max-width: 460px;
}

.notice-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.notice-detail {
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
}

.cardclss {
  border-radius: 10px !important;
}

.n-card {
  height: 100% !important;
  width: 100% !important;
}

.n-card:hover {
  cursor: pointer;
}

.cardclss .n-card {
  border: 0 !important;
  color: black;
  text-align: left;
  --n-close-border-radius: 10px !important;
  background: none;
}
</style>
