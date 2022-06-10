// import { jwtDecrypt } from "@/shared/helper";
// import { Storage } from '@capacitor/storage';
// import axios from 'axios';

const state = {
    qrCode: "",
    inOrOut: "",
    outScanType: "",
    appVersion: "0.0.1"

  }
const getters = {
    getQrCode: (state) => {
        return state.qrCode;
     },
     getInOrOut: (state) => {
        return state.inOrOut;
     },
     getOutScanType: (state) => {
         return state.outScanType;
     },
     getAppVersion: (state) => {
        return state.appVersion;
    }
    }

const mutations= {
    
    setQrCode : (state,payload) => {
        state.qrCode = payload
    },
    setInOrOut : (state,payload) => {
        state.inOrOut = payload
    },
    setOutScanType : (state,payload) => {
        state.outScanType = payload
    }
  }

const actions = {
    
    setQrCode : async ({commit},payload) => {
        commit('setQrCode',payload)
    },
    setInOrOut : async ({commit},payload) => {
        commit('setInOrOut',payload)
    },
    setOutScanType : async({commit},payload) => {
        commit('setOutScanType',payload)
    },
  }

  export default {
      namespaced: true,
      state,
      getters,
      actions,
      mutations
  }