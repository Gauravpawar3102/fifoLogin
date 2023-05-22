<template>
  <ion-page :key="{ keyVal }">
    <div class="container">
      <div class="currentOptionCss">
        <p>{{ currentOption }}</p>
      </div>

      <div class="buttonDown">
        <ion-item v-if="currentOption === 'USAGE SCAN'">
          <ion-input
            label="Enter No of items "
            label-placement="floating"
            fill="solid"
            placeholder="Enter Number of quantity used"
            v-model="inputValue"
          ></ion-input>
          <ion-button @click="submit">update</ion-button>
        </ion-item>
        <ion-button class="goback" @click="stopScanBtn">GO BACK</ion-button>
      </div>
      <div class="barcode-scanner--area--container">
        <div class="relative">
          <!-- <p>Aim your camera at a QR Code {{resval}}</p> -->
          <p>Aim your camera at a QR Code</p>
        </div>
        <div class="square surround-cover" ref="surroundCover">
          <div class="barcode-scanner--area--outer surround-cover">
            <div class="barcode-scanner--area--inner"></div>
          </div>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script>
import {
  toRaw,
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  onUpdated,
} from 'vue';
import {
  IonPage,
  alertController,
  loadingController,
  toastController,
  IonButton,
  // IonInput,
  IonInput,
  IonItem,
} from '@ionic/vue';

import { ref } from 'vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useStore } from 'vuex';
import { qrParser, qrParserDateOfMfg } from '@/shared/helper.js';
import axios from 'axios';
import { Haptics } from '@capacitor/haptics';
// import { createAnimation } from '@ionic/vue';
import { NativeAudio } from '@capacitor-community/native-audio';

// const inputTaker = createComponent({
//   components: { IonInput },
//   setup() {
//     const inputRef = ref(null);
//     const inputValue = ref('');

//     function handleInput(event) {
//       inputValue.value = event.target.value;
//     }

//     return { inputRef, inputValue, handleInput };
//   },
// });

export default defineComponent({
  name: 'ScanPage',
  components: { IonPage, IonInput, IonItem },
  setup() {
    const router = useRouter();
    const inputValue = ref('');

    const res = ref('blank');

    const resval = ref('blank');
    const usageRetVal = ref('blank');

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
      // console.log('onUnmounted stopScan called');

      await BarcodeScanner.stopScan();
    });

    onBeforeRouteLeave(async () => {
      // console.log('onBeforeRouteLeave stopScan called');

      await stopScanBack();
    });

    const inOrOut = computed(() => store.getters['apis/getInOrOut']);

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
      await store.dispatch('auth/getUserData');
      showOrNot.value = true;
      res.value = '';
      BarcodeScanner.hideBackground(); // make background of WebView transparent
      if (inOrOut.value == 'in') {
        currentOption.value = 'INPUT SCAN';
      } else if (inOrOut.value == 'out' && fifoOverride.value == false) {
        currentOption.value = 'OUTPUT SCAN';
      } else if (inOrOut.value == 'out' && fifoOverride.value == true) {
        currentOption.value = 'FIFO OVER-RIDE SCAN';
      } else if (inOrOut.value == 'usage') {
        currentOption.value = 'USAGE SCAN';
        console.log(currentOption.value);
      }
      document.body.style.background = 'transparent';

      const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

      // if the result has content
      if (result.hasContent) {
        res.value = result.content;
        // await warningToast(res.value, 2000);
        await store.dispatch('apis/setQrCode', res.value);
        if (res.value != '') {
          const userData = computed(() => store.getters['auth/getUserData']);
          console.log(userData);
          // warningToast(userData,2000)
          const retVal = qrParser(
            res.value,
            inOrOut.value,
            userData.value.id,
            userData.value.partnerWorkingForKitchen.id //it is null
            // userData.value.partnerWorkingForKitchen.id //(previous)
          );
          resval.value = retVal;
          // await warningToast(retVal, 2000);
          usageRetVal.value = retVal;
          if (!retVal) {
            await warningToast('No retval', 2000);

            await warningToast('OLD/INVALID QR CODE');
            await hapticsVibrate(300);
            await stopScan();
          } else if (inOrOut.value == 'in') {
            // await warningToast(
            //   `im inside inputscan ${inOrOut.value} and ${retVal}`,
            //   2000
            // );

            //call in axios call function
            const access_token = computed(
              () => store.getters['auth/getAuthData'].token
            ).value;
            // console.log(access_token)

            axios.interceptors.request.use(function (config) {
              config.headers.Authorization = 'JWT ' + access_token;
              return config;
            });

            console.log('waddup: ', JSON.stringify(retVal));
            console.log(retVal);
            const response = await axios.post(
              'https://fifo.deepco.in/fifo/inputScan',
              retVal
            );
            const loading = await presentLoading();
            resval.value = response.status;
            console.log('response text: ', response.data);
            if (
              response.data == 'Already EXISTS' ||
              response.data == 'EXISTS'
            ) {
              loading.dismiss();
              // await existsAlert()
              await warningToast('The packet was already scanned');
              await hapticsVibrate(300);
            } else if (response.status == 200 || response.status == 201) {
              loading.dismiss();
              // await successAlert()
              await hapticsVibrate(100);
              await successToast('Successfully Scanned');
            }
          } else if (inOrOut.value == 'out') {
            console.log('the message here is :', currentOption.value);
            //call out axios call function
            const access_token = computed(
              () => store.getters['auth/getAuthData'].token
            ).value;
            // console.log(access_token)

            axios.interceptors.request.use(function (config) {
              config.headers.Authorization = 'JWT ' + access_token;
              return config;
            });

            console.log('waddup: ', JSON.stringify(retVal));
            retVal.outscanType = outscanType.value;
            retVal.fifoOverride = fifoOverride.value;
            const response = await axios.post(
              'https://fifo.deepco.in/fifo/outputScan',
              retVal
            );
            const loading = await presentLoading();
            resval.value = response.status;
            console.log(resval.value);
            await warningToast(resval.value, 2000);

            console.log('out response: ', response.data);
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
          } else if (inOrOut.value == 'usage') {
            console.log('the message here is :', currentOption.value);
            //call out axios call function

            await warningToast(
              //add quantity type

              'Enter the no of quantity' +
                // retVal.unitForMeasurement +
                ' used out of ' +
                retVal.unitChange +
                retVal.unitForMeasurement,
              4000
            );

            console.log('waddup: ', JSON.stringify(retVal));

            retVal.outscanType = outscanType.value;

            //add state here of selected value from usage page
            // inputTaker();
            retVal.used = inputValue.value;
            console.log(resval.value);
          }
        }
        console.log(resval);
        console.log(resval.value);
      }
      // if (outscanType.value !== 'usage') {
      if (resval.value == 200 || resval.value == 201) {
        // await warningToast('im here', 2000);
        //may be here it stopping scanner
        console.log('calling stop scan');
        await stopScan();
        // }
      }
    };
    const submit = async () => {
      // debugger;

      // console.log(usageRetVal.value);
      // if (!inputValue.value) {
      //   return warningToast('please enter inputvalue ', 2000);
      // }
      const access_token = computed(
        () => store.getters['auth/getAuthData'].token
      ).value;
      console.log('access' + access_token);

      axios.interceptors.request.use(function (config) {
        config.headers.Authorization = 'JWT ' + access_token;
        return config;
      });

      usageRetVal.value.used = parseInt(inputValue.value);
      usageRetVal.value.fifoOverride = false;
      console.log(usageRetVal.value.used);
      console.log(toRaw(usageRetVal.value));
      console.log(usageRetVal.value);

      const response = await axios.post(
        'https://fifo.deepco.in/fifo/usageScan',
        toRaw(usageRetVal.value)
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
      } else if (response.data == 'USED') {
        loading.dismiss();
        // await existsAlert()
        await warningToast('Item is used ');
        await hapticsVibrate(300);
      } else if (response.data == 'INPUT SCAN NOT FOUND') {
        loading.dismiss();
        // await successAlert()
        await warningToast('The packet was never input scanned', 2000);
        await hapticsVibrate(100);
      } else if (response.data[0] == 'PACKET FOLLOWS FIFO') {
        loading.dismiss();
        // await successAlert()
        await successToast(
          //add quantity type
          `Successfully Scanned now ${response.data[1].curr_unit}  ${response.data[1].itemID.unitForMeasure} remaining out of  ${response.data[1].unitChange}  ${response.data[1].itemID.unitForMeasure} `
        );
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
      console.log('stopScan called' + showOrNot.value);
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      keyVal.value += 1;
    };
    const stopScanBtn = async () => {
      showOrNot.value = false;
      console.log('stopScanBtn called' + showOrNot.value);
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      router.replace({ path: '/tabs/tab2' });
    };
    const stopScanBack = async () => {
      showOrNot.value = false;
      console.log('stopScanBack called' + showOrNot.value);

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
      submit,
      inputValue,
    };
  },
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}
p {
  color: #fff;
  font-family: sans-serif;
  text-align: center;
  font-weight: 600;
}
html,
body,
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.container {
  display: flex;
}
.relative {
  position: relative;
  z-index: 1;
}
.square {
  width: 100%;
  position: relative;
  overflow: hidden;
  transition: 0.3s;
}
.square:after {
  content: '';
  top: 0;
  display: block;
  padding-bottom: 100%;
}
.square > div {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
.surround-cover {
  box-shadow: 0 0 0 99999px rgba(0, 0, 0, 0.5);
}
.barcode-scanner--area--container {
  width: 80%;
  max-width: min(500px, 80vh);
  margin: auto;
}
.barcode-scanner--area--outer {
  display: flex;
  border-radius: 1em;
}
.barcode-scanner--area--inner {
  width: 100%;
  margin: 1rem;
  border: 2px solid #fff;
  box-shadow: 0px 0px 2px 1px rgb(0 0 0 / 0.5),
    inset 0px 0px 2px 1px rgb(0 0 0 / 0.5);
  border-radius: 1rem;
}

@keyframes shake {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  20% {
    transform: translate(5px, 5px) rotate(-1deg) scale(1.05);
  }
  40% {
    transform: translate(5px, 5px) rotate(-2deg) scale(1.07);
  }
  60% {
    transform: translate(2px, 2px) rotate(0deg) scale(1.04);
  }
  80% {
    transform: translate(-1px, -1px) rotate(-2deg) scale(1.05);
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
}

.buttonDown {
  width: 100%;
  position: absolute;
  z-index: 10;
  top: 80%;
  margin-right: auto;
  left: 0;
  right: 0;
  text-align: center;
}
.goback {
  width: 20%;
  position: absolute;
  z-index: 15;
  top: -500px;
  margin-right: auto;

  left: 16px;
  text-align: center;
}

.currentOptionCss {
  width: 100%;
  position: absolute;
  z-index: 8;
  top: 20%;
  margin-right: auto;
  left: 0;
  right: 0;
  text-align: center;
}

.currentOptionCss p {
  color: #fff;
  font-family: sans-serif;
  text-align: center;
  font-weight: 600;
}
</style>
<style>
.exists-alert {
  --background: rgb(255, 255, 0);
}
.success-alert {
  --background: rgb(3, 249, 3);
}
.noFifo-alert {
  --background: rgb(124, 4, 4);
  --ion-text-color: rgb(225, 225, 225);
}
.successt {
  --background: rgb(4, 111, 4);
}
.warningt {
  --background: rgb(188, 188, 7);
}

.alert-message.sc-ion-alert-md {
  color: white;
}
</style>
