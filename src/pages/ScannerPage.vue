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
          <ion-button @click="startScan('in','none')">InputScan</ion-button>
          <div><p></p></div>
          <div><p></p></div>
          <ion-button @click="startScan('out','output')">OutputScan</ion-button>
          <div><p></p></div>
          <div><p></p></div>
          <ion-button @click="startScan('out','output',true)">OverRide FIFO</ion-button>
          <!-- <ion-button @click="startScan('out','used')">Used Scan</ion-button>
          <div><p></p></div>
          <div><p></p></div>
          <ion-button @click="startScan('out','wasted')">Wastage Scan</ion-button> -->
          <div><p></p></div>
          <div><p></p></div>
          <ion-button @click="startScan('out','wasted')">Wastage Scan</ion-button>

          <!-- <ion-button @click="checkPermission">GrantPerm</ion-button> -->
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
        await checkPermission()
        await store.dispatch("auth/getUserData")
    });

    

    

    

    const startScan = async (inOut,outScanType,fifoOverride=false) => {
      inOrOut.value = inOut
      await store.dispatch("apis/setInOrOut",inOut);
      await store.dispatch("apis/setOutScanType",outScanType);
      await store.dispatch("apis/setFifoOverride",fifoOverride);
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

      const status2 = await BarcodeScanner.checkPermission();

      if (status2.denied) {
        // the user denied permission for good
        // redirect user to app settings if they want to grant it anyway
        const c = confirm(
          'If you want to grant permission for using your camera, enable it in the app settings.',
        );
        if (c) {
          BarcodeScanner.openAppSettings();
        }
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


