<template>
  <ion-page>
    <ion-header v-if="!showOrNot">
      <ion-toolbar>
        <ion-title>Input/Output Scan</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" v-if="!showOrNot">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Input/Output Scan</ion-title>
        </ion-toolbar>
      </ion-header>
      <div class="cntrcntr">
        <div class="cntr">
          <ion-button @click="startScan('in')">InputScan</ion-button>
          <ion-button @click="startScan('out')">OutputScan</ion-button>
          <ion-button @click="checkPermission">GrantPerm</ion-button>
        </div>
      </div>
    </ion-content>

    
  </ion-page>
</template>

<script>
import { defineComponent, onMounted, } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import {ref,} from 'vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import {useRouter} from 'vue-router'
import { useStore } from 'vuex'



export default  defineComponent({
  name: 'ScannerPage',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage ,IonButton},
  setup(){

    const inOrOut = ref("nothing")

    const res = ref("blank");

    const showOrNot = ref(false);

    const router = useRouter();

    const store = useStore();

    onMounted(async () => {
        await store.dispatch("auth/getUserData")
    });

    

    

    

    const startScan = async (inOut) => {
      inOrOut.value = inOut
      await store.dispatch("apis/setInOrOut",inOut);
      await store.dispatch("apis/setQrCode","");
      console.log("ssup")
      router.push({path:'/scan'})
    };

    const checkPermission = async () => {
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (status.granted) {
        // the user granted permission
        return true;
      }

      return false;
    };
    const stopScan = async () => {
      showOrNot.value = false
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
    };
    return {
      startScan,
      stopScan,
      checkPermission,
      res,
      showOrNot,
      inOrOut
    }
  }
});
</script>

<style scoped>
  .cntrcntr{
    display: flex;
    justify-content: space-around;
    height: 100%;
  }
  .cntr{
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 60%;
  }
</style>


