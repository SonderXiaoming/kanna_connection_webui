<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios, { type AxiosError } from "axios";
import { show_notice } from "@/globals/until";

const api_base = import.meta.env.VITE_API_URL || "/kanna_connection/api";
const login_api = `${api_base}/login`;
const route = useRoute();
const router = useRouter();
const login_ticket = route.query.ticket;

const form = ref({
  username: "",
  password: "",
});

if (login_ticket) {
  const ticket = login_ticket.toString();
  router.replace({ path: "/login" }).then(() => try_login_ticket(ticket));
}

function try_login_ticket(ticket: string) {
  axios
    .post(login_api, { ticket }, { withCredentials: true })
    .then(login_success)
    .catch(login_error);
}

function login_success() {
  show_notice("登录成功", "success");
  router.push("/home");
}

function login_error(error: Error | AxiosError) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      show_notice(
        "服务器错误: " + error.response.status + error.response.data.detail
      );
    } else {
      show_notice("服务器错误并且无返回: " + error.message);
    }
  } else {
    show_notice("其他错误: " + error.message);
  }
}

function try_login(_username: string, _password: string) {
  axios
    .post(
      login_api,
      {
        account: _username,
        password: _password,
      },
      { withCredentials: true }
    )
    .then(login_success)
    .catch(login_error);
}
</script>

<template>
  <div class="login">
    <div class="box">
      <div class="left">
        <div class="image"></div>
      </div>
      <div class="right">
        <div class="title">欢 迎 回 来，主 人</div>
        <div class="login-form">
          <input
            class="acc"
            type="text"
            placeholder="QQ号"
            v-model="form.username"
          />
          <input
            class="acc"
            type="password"
            placeholder="密码（不是QQ密码）"
            v-model="form.password"
          />
          <button
            class="submit"
            @click.prevent="try_login(form.username, form.password)"
          >
            登录
          </button>
        </div>
      </div>
    </div>
    <video
      class="video-container"
      src="../assets/img/peko.webm"
      muted
      autoplay
      loop
    ></video>
  </div>
</template>

<style lang="scss" scoped>
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;

  .box {
    min-width: 900px;
    min-height: 500px;
    z-index: 99;
    display: flex;
    overflow: hidden;
    width: 50vw;
    height: 50vh;
    margin: 25vh auto;
    background-color: rgba(255, 255, 255, 60%);
    border-radius: 1.5rem;

    box-shadow: 0 0 1rem 0.2rem rgb(0 0 0 / 10%);

    .left {
      width: 35%;
      height: 100%;
      object-fit: cover;
      min-width: 300px;
      .image {
        width: 100%;
        height: 100%;
        background-image: url("../assets/img/login2.jpg");
        background-size: cover;
        opacity: 0.8;
      }
    }

    .right {
      display: flex;
      width: 65%;
      height: 100%;
      flex-direction: column;
      align-items: center;
      min-width: 400px;

      .title {
        color: rgb(144, 129, 241);
        font-size: 2rem;
        margin-top: 4vh;
      }

      .login-form {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        align-content: center;

        .acc {
          outline: none;
          width: 65%;
          height: 2.5rem;
          font-size: 1rem;
          padding: 1rem 0 0 1.6rem;
          border: none;
          border-bottom: 1px solid #9081f1;
          color: #9081f1;
          background-color: transparent;
          margin: 2rem;
        }

        .acc:focus {
          outline: none;
          color: #9081f1;
          padding: 1rem 0 0 1.6rem;
        }

        .submit {
          width: 40%;
          height: 3rem;
          color: #f6f6f6;
          background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
          font-size: 1rem;
          border: none;
          border-radius: 0.5rem;
          margin: 3rem 0 0 40%;
          transform: translateX(-50%);
        }

        .submit:hover {
          box-shadow: 0 0 2rem -0.5rem rgb(0 0 0 / 15%);
        }
      }
    }
  }

  .video-container {
    width: 100vw;
    height: 100vh;
    position: absolute;
    object-fit: cover;
    filter: blur(15px); //背景模糊设置 */
    -webkit-filter: grayscale(100%);
    filter: grayscale(20%); //背景灰度设置*/
  }
}
</style>

<style>
.acc input {
  margin: 0px 0px 0px;
}
</style>
