import { createRouter, createWebHistory } from '@ionic/vue-router';
import LoginPage from '../pages/LoginPage.vue';
import DashboardPage from '../pages/DashboardPage.vue'
import store from '../store/index';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    meta: {requiredAuth: true}
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

function guard(to, from, next, authData) {
  if (to.meta && to.meta.requiredAuth) {
    if (authData && authData.userId > 0) {
      return next();
    }
    return next({ path: "/login" });
  } else {
    if (authData && authData.userId > 0) {
      return next({ path: "/dashboard" });
    }
    return next();
  }
}

router.beforeEach((to, from, next) => {
  let authData = store.getters['auth/getAuthData'];
  if (authData.userId == 0) {
    store.dispatch("auth/loadStorageTokens").then(
      () => {
        authData = store.getters['auth/getAuthData'];
        return guard(to, from, next, authData);
      },
      () => {
        return guard(to, from, next, authData);
      }
    );
  } else {
    return guard(to, from, next, authData);
  }
});

export default router
