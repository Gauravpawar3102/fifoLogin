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

      <ion-button @click="checkPermission">GrantPerm</ion-button>
      <ion-button @click="startScan">StartScan</ion-button>
      <div >{{res}}</div>
    </ion-content>

    
  </ion-page>
</template>

<script>
import { defineComponent } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import {ref} from 'vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';


export default  defineComponent({
  name: 'Tab1Page',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage ,IonButton},
  setup(){
    const res = ref("Blank");

    const showOrNot = ref(false);

    const startScan = async () => {
      showOrNot.value = true;
      res.value = ""
      BarcodeScanner.hideBackground(); // make background of WebView transparent
      document.body.style.background = "transparent";

      const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

      // if the result has content
      if (result.hasContent) {
        console.log(result.content); // log the raw scanned content
        res.value = result.content;
      }
      if (res.value){
        await stopScan();
      }
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
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    };
    return {
      startScan,
      stopScan,
      checkPermission,
      res,
      showOrNot,
    }
  }
});
</script>


