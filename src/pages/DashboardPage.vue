<template>
  <master-layout pageTitle="Dashboard">
    <ion-card>
      <ion-card-header>
        <ion-card-title>Welcome!</ion-card-title>
      </ion-card-header>
    </ion-card>
    <ion-card-content>
      <ion-item>
        <ion-label>User Name:</ion-label>
        <ion-label>{{
          userData.first_name + " " + userData.last_name
        }}</ion-label>
      </ion-item>
      <ion-item v-if="userData.partnerBrand">
        <ion-label>PartnerBrand:</ion-label>
        <ion-label>{{ userData.partnerBrand.name }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-label>Partner Type:</ion-label>
        <ion-label>{{ userData.partnerType }}</ion-label>
      </ion-item>
      <ion-item v-if="userData.partnerWorkingForKitchen">
        <ion-label>PartnerKitchen:</ion-label>
        <ion-label class="ion-text-wrap">{{
          userData.partnerWorkingForKitchen.name
        }}</ion-label>
      </ion-item>
      <ion-button @click="logoutUser()">Logout</ion-button>
    </ion-card-content>

    <!-- this is the modal for the re logging in -->

      <!-- <ion-modal :is-open="isOpen">
        <ion-header>
          <ion-toolbar>
            <ion-title>Confirmation of Logout</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="logoutUser()">Confirm</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <p>
            You have been logged out successfully. Please re-login to continue..
          </p>
        </ion-content>
      </ion-modal> -->
  </master-layout>
</template>

<script>
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
} from "@ionic/vue";
import { useStore } from "vuex";
import { computed } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { ref, onMounted } from "vue";

export default {
  components: {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButton,
  },
  setup() {
    const store = useStore();

    const router = useRouter();

    const authData = computed(() => store.getters["auth/getAuthData"]);

    const userData = ref("");

    userData.value = authData;

    const logoutUser = async () => {
      // setting and alert to relogin after exiting app
      alert("You have been logged out successfully. Please exit & re-login to continue..");
      await store.dispatch("auth/logoutUser");
      router.push({ path: "/login" });
    };

    onMounted(async () => {
      await store.dispatch("auth/getUserData");
      console.log("We are here right now");
      userData.value = store.getters["auth/getUserData"];
      console.log(userData.value);
    });

    onBeforeRouteLeave(() => {
      userData.value = store.getters["auth/getUserData"];
    });

    return { authData, logoutUser, userData };
  },
};
</script>

<style lang="scss" scoped></style>
