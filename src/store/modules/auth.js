import { jwtDecrypt } from '@/shared/helper';
import { Storage } from '@capacitor/storage';
import axios from 'axios';

const state = {
  authData: {
    token: '',
    refreshToken: '',
    tokenExp: '',
    userId: '',
    userName: '',
  },
  loginStatus: 'failed',
  userData: {
    email: '',
    first_name: '',
    id: 0,
    last_name: '',
    partnerBrand: null,
    partnerType: '',
    partnerWorkingForKitchen: null,
    phoneNumber: '',
    username: '',
  },
};
const getters = {
  getLoginStatus: (state) => {
    return state.loginStatus;
  },
  getAuthData: (state) => {
    return state.authData;
  },
  getUserData: (state) => {
    return state.userData;
  },
};

const mutations = {
  saveAuthToken: (state, payload) => {
    const jwtDecodeUserInfo = jwtDecrypt(payload.access);
    const newAuthData = {
      token: payload.access,
      refreshToken: payload.refresh,
      tokenExp: jwtDecodeUserInfo.exp,
      userId: jwtDecodeUserInfo.user_id,
      userName: jwtDecodeUserInfo.username,
    };
    state.authData = newAuthData;
  },

  saveLoginStatus: (state, status) => {
    state.loginStatus = status;
  },

  resetAuthData: (state, payload) => {
    state.authData = payload;
  },

  setUserData: (state, payload) => {
    state.userData = payload;
  },
};

const actions = {
  loginUser: async ({ commit }, payload) => {
    try {
      const response = await axios.post(
        'https://fifo-update.cokit.tech/auth/jwt/create/',
        payload.value
      );
      console.log(response.data);
      if (response.status == 200 || response.status == 201) {
        await Storage.set({
          key: 'access_token',
          value: response.data.access,
        });
        await Storage.set({
          key: 'refresh_token',
          value: response.data.refresh,
        });

        commit('saveAuthToken', response.data);
        commit('saveLoginStatus', 'success');
      }
    } catch (error) {
      console.log(error.response.data);
      commit('saveLoginStatus', 'failed');
    }
  },

  logoutUser: async ({ commit }) => {
    await Storage.set({
      key: 'access_token',
      value: '',
    });
    await Storage.set({
      key: 'refresh_token',
      value: '',
    });

    commit('resetAuthData', {
      token: '',
      refreshToken: '',
      tokenExp: '',
      userId: '',
      userName: '',
    });

    commit('saveLoginStatus', 'failed');
  },

  getUserData: async ({ commit, getters }) => {
    const access_token = getters.getAuthData.token;
    const yourConfig = {
      headers: {
        Authorization: 'JWT ' + access_token,
      },
    };
    const response = await axios.get(
      'https://fifo-update.cokit.tech/auth/users/me/',
      yourConfig
    );
    console.log(response.data);
    commit('setUserData', response.data);
  },

  loadStorageTokens: async ({ commit }) => {
    const access_token = await Storage.get({ key: 'access_token' });
    const refresh_token = await Storage.get({ key: 'refresh_token' });
    if (access_token && refresh_token) {
      const tokenData = {
        access: access_token.value,
        refresh: refresh_token.value,
      };
      commit('saveAuthToken', tokenData);
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
