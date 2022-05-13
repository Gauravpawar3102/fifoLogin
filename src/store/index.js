import { createStore } from 'vuex';
import auth from './modules/auth';
import apis from './modules/apis'

const store = createStore({
  modules:{
    auth:auth,
    apis:apis
  }
});

export default store;
