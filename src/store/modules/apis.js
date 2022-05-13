// import { jwtDecrypt } from "@/shared/helper";
// import { Storage } from '@capacitor/storage';
// import axios from 'axios';

const state = {
    qrCode: "",
    inOrOut: "",

  }
const getters = {
    getQrCode: (state) => {
        return state.qrCode;
     },
     getInOrOut: (state) => {
        return state.inOrOut;
     },
    }

const mutations= {
    
    setQrCode : (state,payload) => {
        state.qrCode = payload
    },
    setInOrOut : (state,payload) => {
        state.inOrOut = payload
    }
  }

const actions = {
    
    setQrCode : async ({commit},payload) => {
        commit('setQrCode',payload)
    },
    setInOrOut : async ({commit},payload) => {
        commit('setInOrOut',payload)
    },
  }

  export default {
      namespaced: true,
      state,
      getters,
      actions,
      mutations
  }