<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import axios from "axios";
import Cookies from "js-cookie";
const cookie_name = import.meta.env.VITE_Cookie_Name;
const login_api = `${import.meta.env.VITE_API_URL}/login`;

const route = useRoute();
const router = useRouter();
const temp_account = route.query.account;
const temp_password = route.query.password;

const form = ref({
  username: "",
  password: "",
});

if (temp_account && temp_password) {
  try_login(temp_account.toString(), temp_password.toString());
}
const show_notice = (message: string, type: any = "error") => {
  ElMessage({
    message: message,
    type: type,
  });
};

function try_login(
  _username: string = username.value,
  _password: string = password.value
) {
  axios
    .post(login_api, {
      account: _username,
      password: _password,
    })
    .then((response) => {
      show_notice("登录成功", "success");
      Cookies.remove(cookie_name);
      Cookies.set(cookie_name, JSON.stringify(response.data.data), {
        expires: 7,
      });

      router.push("/home");
    })
    .catch((error) => {
      // 错误处理
      if (error.response) {
        // 服务器响应错误
        show_notice(
          "服务器错误: " + error.response.status + error.response.data.detail
        );
      } else if (error.request) {
        // 无法接收服务器响应
        show_notice("服务器错误并且无返回" + error.request);
      } else {
        // 其他类型的错误
        show_notice("其他错误" + error.message);
      }
    });
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
    <div class="video-container">
      <div class="image"></div>
    </div>
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

    .image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(15px); //背景模糊设置 */
      // -webkit-filter: grayscale(100%);
      filter: grayscale(20%); //背景灰度设置*/
      background-image: url("../assets/img/grasp_video1.gif");
      background-position: center 0;
      background-repeat: no-repeat;
      background-attachment: fixed;
      background-size: cover;
      -webkit-background-size: cover;
      /* 兼容Webkit内核浏览器如Chrome和Safari */
      -o-background-size: cover;
      /* 兼容Opera */
    }
  }
}
</style>

<style>
.acc input {
  margin: 0px 0px 0px;
}
</style>
