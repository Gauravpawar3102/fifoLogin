<template>
  <ion-page>
    <ion-list>
      <ion-item>
        <ion-select placeholder="Select used units">
          <ion-select-option value="1">1</ion-select-option>
          <ion-select-option value="2">2</ion-select-option>
          <ion-select-option value="3">3</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
  </ion-page>
</template>
<script>
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  onUpdated,
} from 'vue';
import {
  IonPage,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  alertController,
  loadingController,
  toastController,
  IonButton,
} from '@ionic/vue';

import { ref } from 'vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useStore } from 'vuex';
import { qrParserDateOfMfg } from '@/shared/helper.js';
import axios from 'axios';
import { Haptics } from '@capacitor/haptics';
// import { createAnimation } from '@ionic/vue';
import { NativeAudio } from '@capacitor-community/native-audio';

export default defineComponent({
  name: 'UsageSelector',
  components: { IonPage, IonItem, IonList, IonSelect, IonSelectOption },
  setup() {
    const router = useRouter();

    const res = ref('blank');

    const resval = ref('blank');

    const keyVal = ref(1);

    const showOrNot = ref(false);

    const store = useStore();

    onMounted(async () => {
      await startScan();
    });

    onUpdated(async () => {
      await startScan();
    });

    onUnmounted(async () => {
      await BarcodeScanner.stopScan();
    });

    onBeforeRouteLeave(async () => {
      await stopScanBack();
    });

    // const inOrOut = computed(() => store.getters['apis/getInOrOut']);

    const outscanType = computed(() => store.getters['apis/getOutScanType']);

    const fifoOverride = computed(() => store.getters['apis/getFifoOverride']);

    const surroundCover = ref(null);

    const currentOption = ref('');

    NativeAudio.preload({
      assetId: 'success',
      assetPath: 'public/assets/success.mp3',
      audioChannelNum: 1,
      isUrl: false,
      volume: 1.0,
    });

    NativeAudio.preload({
      assetId: 'error',
      assetPath: 'public/assets/error.mp3',
      audioChannelNum: 1,
      isUrl: false,
      volume: 1.0,
    });

    //     {
    //     "timestamp": "2022-02-27T10:15:17.843056Z",
    //     "expDate": null,
    //     "qrcode": "abcd4567",
    //     "batchDetails": "fasdfasdf",
    //     "unitChange": null,
    //     "brandID": 1,
    //     "destKitchen": 1,
    //     "recipeID": 3,
    //     "itemID": null,
    //     "partnerID" : 1
    // }

    const startScan = async () => {
      // retVal.outscanType = outscanType.value;
      // router.push({ path: '/usage' });

      // retVal.used = 1;//add state here of selected value from usage page
      const response = await axios.post(
        'https://fifo.deepco.in/fifo/usageScan',
        {
          timestamp: '2022-05-22T09:07:55.076457Z',
          expDate: '2023-03-02',
          qrcode: 'i=11#1#1#3#5 nos#2023-02-27#16:26:56#1677495416190.073',
          batchDetails: 'nothing',
          unitChange: 3,

          brandID: 1,
          sourceKitchen: 1,

          recipeID: null,
          used: 1,

          itemID: 2,
          outscanType: 'usage',
          fifoOverride: false,
        }
      );
      const loading = await presentLoading();
      resval.value = response.status;
      console.log(resval.value);
      console.log('usage response: ', response.data);
      if (response.data == 'EXISTS') {
        loading.dismiss();
        // await existsAlert()
        await warningToast('The packet was already scanned');
        await hapticsVibrate(300);
      } else if (response.data == 'INPUT SCAN NOT FOUND') {
        loading.dismiss();
        // await successAlert()
        await warningToast('The packet was never input scanned', 2000);
        await hapticsVibrate(100);
      } else if (response.data[0] == 'PACKET FOLLOWS FIFO') {
        loading.dismiss();
        // await successAlert()
        await successToast('Successfully Scanned');
        await hapticsVibrate(100);
      } else if (response.data[0] == 'PACKET DOES NOT FOLLOW FIFO') {
        loading.dismiss();
        await hapticsVibrate(300);
        await noFifoAlert(response.data[1]);
      } else if (
        response.status == 201 &&
        outscanType.value == 'used' &&
        response.data[0] == 'PACKET SENT TO USED PILE'
      ) {
        loading.dismiss();
        await hapticsVibrate(300);
        await warningToast('Usage recorded', 2000);
      } else if (
        response.status == 201 &&
        outscanType.value == 'wasted' &&
        response.data[0] == 'PACKET SENT TO WASTED PILE'
      ) {
        loading.dismiss();
        await hapticsVibrate(300);
        await warningToast('Wastage recorded', 2000);
      } else if (
        response.status == 201 &&
        outscanType.value == 'output' &&
        fifoOverride.value == true
      ) {
        loading.dismiss();
        await hapticsVibrate(300);
        await successToast('FIFO OVERRIDE DONE', 2000);
      }
    };

    const existsAlert = async () => {
      const alert = await alertController.create({
        cssClass: 'exists-alert',
        header: 'Alert',
        subHeader: 'Already Exists',
        message: 'The packet was already scanned',
        buttons: ['OK'],
      });
      await alert.present();

      const { role } = await alert.onDidDismiss();
      console.log('onDidDismiss resolved with role', role);
    };

    const successAlert = async () => {
      const alert = await alertController.create({
        cssClass: 'success-alert',
        header: 'Alert',
        subHeader: 'Success',
        message: 'Successfully Scanned',
        buttons: ['OK'],
      });
      await alert.present();

      const { role } = await alert.onDidDismiss();
      console.log('onDidDismiss resolved with role', role);
    };

    const noFifoAlert = async (dataObj) => {
      surroundCover.value.style.boxShadow =
        '0 0 0 99999px rgba(153, 0, 0, 0.7)';
      NativeAudio.play({
        assetId: 'error',
        // time: 6.0 - seek time
      });
      const alert = await alertController.create({
        cssClass: 'noFifo-alert',
        header: 'Alert',
        subHeader: 'FIFO NOT FOLLOWED',
        message:
          'Please get this packet with date of manufacture instead : ' +
          qrParserDateOfMfg(dataObj.qrcode),
        buttons: ['OK'],
      });
      await alert.present();

      const { role } = await alert.onDidDismiss();
      console.log('onDidDismiss resolved with role', role);
    };

    const warningToast = async (msgg, durr = 2000) => {
      surroundCover.value.style.boxShadow =
        '0 0 0 99999px rgba(255, 255, 0, 0.7)';

      NativeAudio.play({
        assetId: 'error',
        // time: 6.0 - seek time
      });

      const toast = await toastController.create({
        message: msgg,
        duration: durr,
        cssClass: 'warningt',
      });
      return toast.present();
    };

    const successToast = async (msgg, durr = 2000) => {
      surroundCover.value.style.boxShadow =
        '0 0 0 99999px rgba(0, 153, 51, 0.7)';

      NativeAudio.play({
        assetId: 'success',
        // time: 6.0 - seek time
      });

      const toast = await toastController.create({
        message: msgg,
        duration: durr,
        cssClass: 'successt',
      });
      return toast.present();
    };

    const presentLoading = async () => {
      const loading = await loadingController.create({
        cssClass: 'loading-spinner',
        message: 'Please wait...',
      });

      await loading.present();
      return loading;
    };

    const hapticsVibrate = async (duration) => {
      await Haptics.vibrate(duration);
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
          'If you want to grant permission for using your camera, enable it in the app settings.'
        );
        if (c) {
          BarcodeScanner.openAppSettings();
        }
      }

      return false;
    };
    const stopScan = async () => {
      showOrNot.value = false;
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      keyVal.value += 1;
    };
    const stopScanBtn = async () => {
      showOrNot.value = false;
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      router.replace({ path: '/tabs/tab2' });
    };
    const stopScanBack = async () => {
      showOrNot.value = false;
      BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      await BarcodeScanner.stopScan();
    };
    return {
      startScan,
      stopScanBtn,
      stopScan,
      checkPermission,
      existsAlert,
      successAlert,
      res,
      showOrNot,
      resval,
      keyVal,
      warningToast,
      successToast,
      hapticsVibrate,
      surroundCover,
      IonButton,
      currentOption,
    };
  },
});
</script>
<style></style>
