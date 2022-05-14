<template>
    <master-layout pageTitle="Login Form">
        <ion-card>
            <ion-card-header>
                <ion-card-title>SignIn</ion-card-title>
            </ion-card-header>
            <ion-card-content>
                <ion-item>
                    <ion-label position="floating">Phone Number</ion-label>
                    <div>
                        <ion-input v-model="userInfo.phoneNumber" autocomplete="username"></ion-input>
                    </div>
                </ion-item>
                <ion-item>
                    <ion-label position="floating">Password</ion-label>
                    <div>
                        <ion-input type="password" v-model="userInfo.password" autocomplete="current-password"></ion-input>
                    </div>
                </ion-item>
                <ion-button expand="full" @click="login()">Login</ion-button>
            </ion-card-content>
        </ion-card>
    </master-layout>
</template>

<script>

import { IonCard,IonCardHeader,IonCardTitle,IonCardContent,IonItem,IonLabel,IonInput,IonButton } from "@ionic/vue";
import { mapGetters } from "vuex";
import {ref} from 'vue';
import { useStore } from 'vuex'
import { computed } from 'vue'
import { useRouter } from 'vue-router'


export default {
    components: {
            IonCard,IonCardHeader,IonCardTitle,IonCardContent,IonItem,IonLabel,IonInput,IonButton
    },
    computed:{
        ...mapGetters("auth", {
        loginStatus: "getLoginStatus",
        }),
    },
    setup () {

        const router = useRouter()


        const store = useStore()

        const loginStatus = computed(() => store.getters['auth/getLoginStatus'])

        const userInfo = ref({
                phoneNumber: "",
                password: "",
            });

        const login = async () => {
                if (userInfo.value.phoneNumber && userInfo.value.password){
                    await store.dispatch("auth/loginUser",userInfo);
                    if(loginStatus.value === "success"){
                        alert('login success');
                        router.push({path:'/tabs/tab2'})
                    }else{
                        alert('Login Failed - Check your Credentials')
                    }
                }
            }
        

            return {userInfo,login}
        }
}
</script>

<style lang="scss" scoped>

</style>