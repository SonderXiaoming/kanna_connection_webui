import { createRouter, createWebHistory } from 'vue-router'
import Cookies from 'js-cookie'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'base',
      component: () => import('@/views/LoginPage.vue')
    },
    {
      path: '/home',
      name: 'HomePage',
      component: () => import('@/views/HomePage.vue')
    },
    {
      path: '/login',
      name: 'LoginPage',
      component: () => import('@/views/LoginPage.vue')
    },
    {
      path: '/:group_id/dashboard',
      name: 'DashBoard',
      component: () => import('@/views/DashBoard.vue')
    },
    {
      path: '/:group_id/noticetable',
      name: 'NoticeTable',
      component: () => import('@/views/NoticeTable.vue')
    },
    {
      path: '/:group_id/reporttable',
      name: 'ReportTable',
      component: () => import('@/views/ReportTable.vue')
    }
  ]
})

function checkAuth() {
  const hasCookie = Cookies.get(import.meta.env.VITE_Cookie_Name)
  return hasCookie
}

router.beforeEach((to, from, next) => {
  if (to.path !== '/login' && !checkAuth()) {
    // 如果不在登录页面且没有Cookie，跳转到登录页面
    next('/login')
  } else {
    // 如果有Cookie或是在登录页面，直接导航到目标页面
    next()
  }
})

export default router
