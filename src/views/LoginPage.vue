<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import Cookies from 'js-cookie'
const cookie_name = import.meta.env.VITE_Cookie_Name
const login_api = `${import.meta.env.VITE_API_URL}/login`

const route = useRoute()
const router = useRouter()
const temp_account = route.query.account
const temp_password = route.query.password

var username = ref('')
var password = ref('')

if (temp_account && temp_password) {
  try_login(temp_account.toString(), temp_password.toString())
}
const show_notice = (message: string, type: any = 'error') => {
  ElMessage({
    message: message,
    type: type
  })
}

function try_login(_username: string = username.value, _password: string = password.value) {
  axios
    .post(login_api, {
      account: _username,
      password: _password
    })
    .then((response) => {
      show_notice('登录成功', 'success')
      Cookies.remove(cookie_name)
      Cookies.set(cookie_name, JSON.stringify(response.data.data), {
        expires: 7
      })

      router.push('/home')
    })
    .catch((error) => {
      // 错误处理
      if (error.response) {
        // 服务器响应错误
        show_notice('服务器错误: ' + error.response.status + error.response.data.detail)
      } else if (error.request) {
        // 无法接收服务器响应
        show_notice('服务器错误并且无返回' + error.request)
      } else {
        // 其他类型的错误
        show_notice('其他错误' + error.message)
      }
    })
}
</script>

<template>
  <main>
    <div class="box">
      <div class="left"></div>
      <div class="right">
        <h4>欢 迎 回 来，主 人</h4>
        <div class="login-form">
          <input class="acc" type="text" placeholder="QQ号" v-model="username" />
          <input class="acc" type="password" placeholder="密码（不是QQ密码）" v-model="password" />
          <button class="submit" @click.prevent="try_login()">登录</button>
        </div>
      </div>
    </div>
  </main>
  <div class="video-container">
    <video class="video" src="../assets/video/peko2.mp4" muted loop autoplay></video>
  </div>
</template>

<style lang="scss" scopen>
html {
  font-size: 10px;
  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: -1;
  }
}

.video-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: black;
  z-index: -99;
  .video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(15px); //背景模糊设置 */
    -webkit-filter: grayscale(100%);
    filter: grayscale(20%); //背景灰度设置*/
  }
}

.box {
  display: flex;
  overflow: hidden;
  width: 90rem;
  height: 55rem;
  background-color: rgba(255, 255, 255, 60%);
  border-radius: 1.5rem;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 25%);
  box-shadow: 0 0 1rem 0.2rem rgb(0 0 0 / 10%);
  .left {
    position: relative;
    width: 35%;
    height: 100%;
    background-color: skyblue;
    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: url('../assets/img/login2.jpg');
      background-size: cover;
      opacity: 0.8;
    }
  }
  .right {
    display: flex;
    width: 65%;
    flex-direction: column;
    align-items: center;
    h4 {
      color: rgb(144, 129, 241);
      font-size: 3rem;
      margin-top: 5rem;
    }
    .login-form {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      .acc {
        outline: none;
        width: 80%;
        height: 5rem;
        font-size: 1.6rem;
        margin-top: 5rem;
        padding: 1rem 0 0 1.6rem;
        border: none;
        border-bottom: 1px solid #9081f1;
        color: #9081f1;
        background-color: transparent;
      }
      .acc:focus {
        outline: none;
        color: #9081f1;
        padding: 1rem 0 0 1.6rem;
      }
    }
    .submit {
      width: 60%;
      height: 5rem;
      color: #f6f6f6;
      background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
      font-size: 1.4rem;
      border: none;
      border-radius: 0.5rem;
      margin: 6rem 0 0 50%;
      transform: translateX(-50%);
    }
    .submit:hover {
      box-shadow: 0 0 2rem -0.5rem rgb(0 0 0 / 15%);
    }
  }
}
</style>
